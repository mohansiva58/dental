import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

// Simple in-memory session (production would use express-session + DB)
const sessions = new Map<string, number>();

function generateToken(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Simple password check (in demo: plaintext; in prod: bcrypt)
function checkPassword(plain: string, stored: string): boolean {
  return plain === stored;
}

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const { username, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user || !checkPassword(password, user.hashedPassword)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  if (user.status !== "active") {
    res.status(403).json({ error: "Account disabled" });
    return;
  }
  const token = generateToken();
  sessions.set(token, user.id);
  // update lastLoginAt
  await db.update(usersTable).set({ lastLoginAt: new Date() }).where(eq(usersTable.id, user.id));
  res.cookie("session", token, { httpOnly: true, sameSite: "lax", maxAge: 86400000 });
  res.json({
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    },
  });
});

router.post("/auth/logout", (req, res) => {
  const token = req.cookies?.session;
  if (token) sessions.delete(token);
  res.clearCookie("session");
  res.json({ ok: true });
});

router.get("/auth/me", async (req, res) => {
  const token = req.cookies?.session;
  if (!token || !sessions.has(token)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = sessions.get(token)!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
  });
});

export { sessions };
export default router;
