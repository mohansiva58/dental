import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { followupsTable, patientsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateFollowupBody, UpdateFollowupParams, UpdateFollowupBody, ListFollowupsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/followups", async (req, res) => {
  const parsed = ListFollowupsQueryParams.safeParse(req.query);
  const { patientId, status } = parsed.success ? parsed.data : { patientId: undefined, status: undefined };
  const conditions = [];
  if (patientId) conditions.push(eq(followupsTable.patientId, patientId));
  if (status) conditions.push(eq(followupsTable.status, status));
  const rows = await db.select({
    id: followupsTable.id, patientId: followupsTable.patientId, scheduledDate: followupsTable.scheduledDate,
    status: followupsTable.status, notes: followupsTable.notes, createdAt: followupsTable.createdAt,
    patientName: patientsTable.fullName,
  }).from(followupsTable).leftJoin(patientsTable, eq(followupsTable.patientId, patientsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(followupsTable.scheduledDate);
  res.json(rows.map((r) => ({ ...r, scheduledDate: r.scheduledDate.toISOString(), createdAt: r.createdAt.toISOString(), patientName: r.patientName ?? null })));
});

router.post("/followups", async (req, res) => {
  const parsed = CreateFollowupBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const [row] = await db.insert(followupsTable).values({ ...parsed.data, scheduledDate: new Date(parsed.data.scheduledDate) }).returning();
  const [patient] = await db.select({ fullName: patientsTable.fullName }).from(patientsTable).where(eq(patientsTable.id, row.patientId));
  res.status(201).json({ ...row, scheduledDate: row.scheduledDate.toISOString(), createdAt: row.createdAt.toISOString(), patientName: patient?.fullName ?? null });
});

router.patch("/followups/:id", async (req, res) => {
  const paramsParsed = UpdateFollowupParams.safeParse({ id: parseInt(req.params.id) });
  if (!paramsParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const bodyParsed = UpdateFollowupBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const updates: Record<string, unknown> = { ...bodyParsed.data };
  if (bodyParsed.data.scheduledDate) updates.scheduledDate = new Date(bodyParsed.data.scheduledDate);
  const [row] = await db.update(followupsTable).set(updates).where(eq(followupsTable.id, paramsParsed.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, scheduledDate: row.scheduledDate.toISOString(), createdAt: row.createdAt.toISOString(), patientName: null });
});

export default router;
