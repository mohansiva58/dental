import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { invoicesTable, patientsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateInvoiceBody, GetInvoiceParams, UpdateInvoiceParams, UpdateInvoiceBody, ListInvoicesQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

async function generateInvoiceNumber(): Promise<string> {
  const rows = await db.select({ id: invoicesTable.id }).from(invoicesTable);
  const count = rows.length + 1;
  const date = new Date();
  return `INV${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(count).padStart(4, "0")}`;
}

function formatInvoice(inv: any, patientName: string | null) {
  return {
    ...inv,
    total: Number(inv.total),
    subtotal: Number(inv.subtotal),
    paymentDate: inv.paymentDate?.toISOString() ?? null,
    createdAt: inv.createdAt.toISOString(),
    patientName,
  };
}

router.get("/invoices", async (req, res) => {
  const parsed = ListInvoicesQueryParams.safeParse(req.query);
  const { patientId, paymentStatus } = parsed.success ? parsed.data : { patientId: undefined, paymentStatus: undefined };
  const conditions = [];
  if (patientId) conditions.push(eq(invoicesTable.patientId, patientId));
  if (paymentStatus) conditions.push(eq(invoicesTable.paymentStatus, paymentStatus));
  const rows = await db.select({
    id: invoicesTable.id, invoiceNumber: invoicesTable.invoiceNumber, patientId: invoicesTable.patientId,
    opRecordId: invoicesTable.opRecordId, items: invoicesTable.items, subtotal: invoicesTable.subtotal,
    total: invoicesTable.total, paymentStatus: invoicesTable.paymentStatus, paymentMethod: invoicesTable.paymentMethod,
    paymentDate: invoicesTable.paymentDate, createdAt: invoicesTable.createdAt, patientName: patientsTable.fullName,
  }).from(invoicesTable).leftJoin(patientsTable, eq(invoicesTable.patientId, patientsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(invoicesTable.createdAt);
  res.json(rows.map((r) => formatInvoice(r, r.patientName ?? null)));
});

router.post("/invoices", async (req, res) => {
  const parsed = CreateInvoiceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const invoiceNumber = await generateInvoiceNumber();
  const { subtotal, total, ...invRest } = parsed.data;
  const [inv] = await db.insert(invoicesTable).values({ ...invRest, invoiceNumber, subtotal: String(subtotal), total: String(total) }).returning();
  const [patient] = await db.select({ fullName: patientsTable.fullName }).from(patientsTable).where(eq(patientsTable.id, inv.patientId));
  res.status(201).json(formatInvoice(inv, patient?.fullName ?? null));
});

router.get("/invoices/:id", async (req, res) => {
  const parsed = GetInvoiceParams.safeParse({ id: parseInt(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.select({
    id: invoicesTable.id, invoiceNumber: invoicesTable.invoiceNumber, patientId: invoicesTable.patientId,
    opRecordId: invoicesTable.opRecordId, items: invoicesTable.items, subtotal: invoicesTable.subtotal,
    total: invoicesTable.total, paymentStatus: invoicesTable.paymentStatus, paymentMethod: invoicesTable.paymentMethod,
    paymentDate: invoicesTable.paymentDate, createdAt: invoicesTable.createdAt, patientName: patientsTable.fullName,
  }).from(invoicesTable).leftJoin(patientsTable, eq(invoicesTable.patientId, patientsTable.id)).where(eq(invoicesTable.id, parsed.data.id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatInvoice(row, row.patientName ?? null));
});

router.patch("/invoices/:id", async (req, res) => {
  const paramsParsed = UpdateInvoiceParams.safeParse({ id: parseInt(req.params.id) });
  if (!paramsParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const bodyParsed = UpdateInvoiceBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const updates: Record<string, unknown> = { ...bodyParsed.data };
  if (bodyParsed.data.paymentDate) updates.paymentDate = new Date(bodyParsed.data.paymentDate);
  const [inv] = await db.update(invoicesTable).set(updates).where(eq(invoicesTable.id, paramsParsed.data.id)).returning();
  if (!inv) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatInvoice(inv, null));
});

export default router;
