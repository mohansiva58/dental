import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateUserBody, GetUserParams, UpdateUserParams, UpdateUserBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users", async (_req, res) => {
  const users = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    fullName: usersTable.fullName,
    role: usersTable.role,
    status: usersTable.status,
    lastLoginAt: usersTable.lastLoginAt,
  }).from(usersTable).orderBy(usersTable.createdAt);
  res.json(users.map((u) => ({ ...u, lastLoginAt: u.lastLoginAt?.toISOString() ?? null })));
});

router.post("/users", async (req, res) => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const { username, password, fullName, role } = parsed.data;
  const [user] = await db.insert(usersTable).values({
    username,
    hashedPassword: password, // plaintext for demo
    fullName,
    role,
    status: "active",
  }).returning();
  res.status(201).json({ id: user.id, username: user.username, fullName: user.fullName, role: user.role, status: user.status, lastLoginAt: null });
});

router.get("/users/:id", async (req, res) => {
  const parsed = GetUserParams.safeParse({ id: parseInt(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, parsed.data.id));
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: user.id, username: user.username, fullName: user.fullName, role: user.role, status: user.status, lastLoginAt: user.lastLoginAt?.toISOString() ?? null });
});

router.patch("/users/:id", async (req, res) => {
  const paramsParsed = UpdateUserParams.safeParse({ id: parseInt(req.params.id) });
  if (!paramsParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const bodyParsed = UpdateUserBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const updates: Record<string, unknown> = {};
  const { fullName, role, status, password } = bodyParsed.data;
  if (fullName !== undefined) updates.fullName = fullName;
  if (role !== undefined) updates.role = role;
  if (status !== undefined) updates.status = status;
  if (password !== undefined) updates.hashedPassword = password;
  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, paramsParsed.data.id)).returning();
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: user.id, username: user.username, fullName: user.fullName, role: user.role, status: user.status, lastLoginAt: user.lastLoginAt?.toISOString() ?? null });
});

export default router;
