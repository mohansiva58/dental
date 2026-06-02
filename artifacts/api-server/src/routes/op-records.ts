import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { opRecordsTable, patientsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateOpRecordBody, GetOpRecordParams, UpdateOpRecordParams, UpdateOpRecordBody, ListOpRecordsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

async function generateOpNumber(): Promise<string> {
  const records = await db.select({ id: opRecordsTable.id }).from(opRecordsTable);
  const count = records.length + 1;
  const date = new Date();
  return `OP${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(count).padStart(4, "0")}`;
}

router.get("/op-records", async (req, res) => {
  const parsed = ListOpRecordsQueryParams.safeParse(req.query);
  const { patientId, status } = parsed.success ? parsed.data : { patientId: undefined, status: undefined };

  const conditions = [];
  if (patientId) conditions.push(eq(opRecordsTable.patientId, patientId));
  if (status) conditions.push(eq(opRecordsTable.status, status));

  const records = await db
    .select({
      id: opRecordsTable.id, opNumber: opRecordsTable.opNumber, patientId: opRecordsTable.patientId,
      startDate: opRecordsTable.startDate, expiryDate: opRecordsTable.expiryDate,
      status: opRecordsTable.status, visitReason: opRecordsTable.visitReason,
      createdAt: opRecordsTable.createdAt, patientName: patientsTable.fullName,
    })
    .from(opRecordsTable)
    .leftJoin(patientsTable, eq(opRecordsTable.patientId, patientsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(opRecordsTable.createdAt);

  // Auto-expire records past their expiry date
  const now = new Date();
  const result = records.map((r) => ({
    ...r,
    status: r.status === "active" && r.expiryDate < now ? "expired" : r.status,
    startDate: r.startDate.toISOString(),
    expiryDate: r.expiryDate.toISOString(),
    createdAt: r.createdAt.toISOString(),
    patientName: r.patientName ?? null,
  }));
  res.json(result);
});

router.post("/op-records", async (req, res) => {
  const parsed = CreateOpRecordBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const opNumber = await generateOpNumber();
  const startDate = new Date();
  const expiryDate = new Date(startDate);
  expiryDate.setDate(expiryDate.getDate() + 15);
  const [op] = await db.insert(opRecordsTable).values({ ...parsed.data, opNumber, startDate, expiryDate, status: "active" }).returning();
  const [patient] = await db.select({ fullName: patientsTable.fullName }).from(patientsTable).where(eq(patientsTable.id, op.patientId));
  res.status(201).json({ ...op, startDate: op.startDate.toISOString(), expiryDate: op.expiryDate.toISOString(), createdAt: op.createdAt.toISOString(), patientName: patient?.fullName ?? null });
});

router.get("/op-records/:id", async (req, res) => {
  const parsed = GetOpRecordParams.safeParse({ id: parseInt(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [op] = await db.select({
    id: opRecordsTable.id, opNumber: opRecordsTable.opNumber, patientId: opRecordsTable.patientId,
    startDate: opRecordsTable.startDate, expiryDate: opRecordsTable.expiryDate,
    status: opRecordsTable.status, visitReason: opRecordsTable.visitReason,
    createdAt: opRecordsTable.createdAt, patientName: patientsTable.fullName,
  }).from(opRecordsTable).leftJoin(patientsTable, eq(opRecordsTable.patientId, patientsTable.id)).where(eq(opRecordsTable.id, parsed.data.id));
  if (!op) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...op, startDate: op.startDate.toISOString(), expiryDate: op.expiryDate.toISOString(), createdAt: op.createdAt.toISOString(), patientName: op.patientName ?? null });
});

router.patch("/op-records/:id", async (req, res) => {
  const paramsParsed = UpdateOpRecordParams.safeParse({ id: parseInt(req.params.id) });
  if (!paramsParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const bodyParsed = UpdateOpRecordBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const [op] = await db.update(opRecordsTable).set(bodyParsed.data).where(eq(opRecordsTable.id, paramsParsed.data.id)).returning();
  if (!op) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...op, startDate: op.startDate.toISOString(), expiryDate: op.expiryDate.toISOString(), createdAt: op.createdAt.toISOString(), patientName: null });
});

export default router;
