import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { revisitsTable, diagnosesTable, prescriptionsTable, treatmentsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateRevisitBody, ListRevisitsQueryParams,
  CreateDiagnosisBody, UpdateDiagnosisParams, UpdateDiagnosisBody, ListDiagnosesQueryParams,
  CreatePrescriptionBody, UpdatePrescriptionParams, UpdatePrescriptionBody, DeletePrescriptionParams, ListPrescriptionsQueryParams,
  CreateTreatmentBody, UpdateTreatmentParams, UpdateTreatmentBody, ListTreatmentsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Revisits
router.get("/revisits", async (req, res) => {
  const parsed = ListRevisitsQueryParams.safeParse(req.query);
  const { opRecordId } = parsed.success ? parsed.data : { opRecordId: undefined };
  const rows = await db.select().from(revisitsTable)
    .where(opRecordId ? eq(revisitsTable.opRecordId, opRecordId) : undefined)
    .orderBy(revisitsTable.visitDate);
  // get doctor names
  const doctorIds = [...new Set(rows.filter((r) => r.doctorId).map((r) => r.doctorId!))];
  const doctors = doctorIds.length > 0 ? await db.select({ id: usersTable.id, fullName: usersTable.fullName }).from(usersTable) : [];
  const doctorMap = new Map(doctors.map((d) => [d.id, d.fullName]));
  res.json(rows.map((r) => ({ ...r, visitDate: r.visitDate.toISOString(), createdAt: r.createdAt.toISOString(), doctorName: r.doctorId ? doctorMap.get(r.doctorId) ?? null : null })));
});

router.post("/revisits", async (req, res) => {
  const parsed = CreateRevisitBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const [row] = await db.insert(revisitsTable).values({ ...parsed.data, visitDate: new Date(parsed.data.visitDate) }).returning();
  res.status(201).json({ ...row, visitDate: row.visitDate.toISOString(), createdAt: row.createdAt.toISOString(), doctorName: null });
});

// Diagnoses
router.get("/diagnoses", async (req, res) => {
  const parsed = ListDiagnosesQueryParams.safeParse(req.query);
  const { patientId, opRecordId } = parsed.success ? parsed.data : { patientId: undefined, opRecordId: undefined };
  const conditions = [];
  if (patientId) conditions.push(eq(diagnosesTable.patientId, patientId));
  if (opRecordId) conditions.push(eq(diagnosesTable.opRecordId, opRecordId));
  const rows = await db.select().from(diagnosesTable).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(diagnosesTable.createdAt);
  const creatorIds = [...new Set(rows.filter((r) => r.createdBy).map((r) => r.createdBy!))];
  const creators = creatorIds.length > 0 ? await db.select({ id: usersTable.id, fullName: usersTable.fullName }).from(usersTable) : [];
  const creatorMap = new Map(creators.map((c) => [c.id, c.fullName]));
  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), createdByName: r.createdBy ? creatorMap.get(r.createdBy) ?? null : null })));
});

router.post("/diagnoses", async (req, res) => {
  const parsed = CreateDiagnosisBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const [row] = await db.insert(diagnosesTable).values(parsed.data).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString(), createdByName: null });
});

router.patch("/diagnoses/:id", async (req, res) => {
  const paramsParsed = UpdateDiagnosisParams.safeParse({ id: parseInt(req.params.id) });
  if (!paramsParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const bodyParsed = UpdateDiagnosisBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const [row] = await db.update(diagnosesTable).set(bodyParsed.data).where(eq(diagnosesTable.id, paramsParsed.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString(), createdByName: null });
});

// Prescriptions
router.get("/prescriptions", async (req, res) => {
  const parsed = ListPrescriptionsQueryParams.safeParse(req.query);
  const { patientId } = parsed.success ? parsed.data : { patientId: undefined };
  const rows = await db.select().from(prescriptionsTable).where(patientId ? eq(prescriptionsTable.patientId, patientId) : undefined).orderBy(prescriptionsTable.createdAt);
  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/prescriptions", async (req, res) => {
  const parsed = CreatePrescriptionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const [row] = await db.insert(prescriptionsTable).values(parsed.data).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/prescriptions/:id", async (req, res) => {
  const paramsParsed = UpdatePrescriptionParams.safeParse({ id: parseInt(req.params.id) });
  if (!paramsParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const bodyParsed = UpdatePrescriptionBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const [row] = await db.update(prescriptionsTable).set(bodyParsed.data).where(eq(prescriptionsTable.id, paramsParsed.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.delete("/prescriptions/:id", async (req, res) => {
  const parsed = DeletePrescriptionParams.safeParse({ id: parseInt(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(prescriptionsTable).where(eq(prescriptionsTable.id, parsed.data.id));
  res.status(204).end();
});

// Treatments
router.get("/treatments", async (req, res) => {
  const parsed = ListTreatmentsQueryParams.safeParse(req.query);
  const { patientId } = parsed.success ? parsed.data : { patientId: undefined };
  const rows = await db.select().from(treatmentsTable).where(patientId ? eq(treatmentsTable.patientId, patientId) : undefined).orderBy(treatmentsTable.createdAt);
  res.json(rows.map((r) => ({ ...r, cost: r.cost ? Number(r.cost) : null, createdAt: r.createdAt.toISOString() })));
});

router.post("/treatments", async (req, res) => {
  const parsed = CreateTreatmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const { cost, ...rest } = parsed.data;
  const [row] = await db.insert(treatmentsTable).values({ ...rest, cost: cost != null ? String(cost) : null }).returning();
  res.status(201).json({ ...row, cost: row.cost ? Number(row.cost) : null, createdAt: row.createdAt.toISOString() });
});

router.patch("/treatments/:id", async (req, res) => {
  const paramsParsed = UpdateTreatmentParams.safeParse({ id: parseInt(req.params.id) });
  if (!paramsParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const bodyParsed = UpdateTreatmentBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const { cost, ...rest } = bodyParsed.data;
  const updates: Record<string, unknown> = { ...rest };
  if (cost !== undefined) updates.cost = cost != null ? String(cost) : null;
  const [row] = await db.update(treatmentsTable).set(updates).where(eq(treatmentsTable.id, paramsParsed.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, cost: row.cost ? Number(row.cost) : null, createdAt: row.createdAt.toISOString() });
});

export default router;
