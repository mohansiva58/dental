import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { patientsTable, opRecordsTable, treatmentsTable, invoicesTable, followupsTable } from "@workspace/db";
import { eq, gte, and, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res) => {
  const [totalPatients] = await db.select({ count: sql<number>`count(*)` }).from(patientsTable);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [todayPatients] = await db.select({ count: sql<number>`count(*)` }).from(patientsTable).where(gte(patientsTable.createdAt, today));
  const [activeOps] = await db.select({ count: sql<number>`count(*)` }).from(opRecordsTable).where(eq(opRecordsTable.status, "active"));
  const [activeTreatments] = await db.select({ count: sql<number>`count(*)` }).from(treatmentsTable).where(eq(treatmentsTable.status, "in-progress"));
  const [upcomingFollowups] = await db.select({ count: sql<number>`count(*)` }).from(followupsTable).where(and(eq(followupsTable.status, "pending"), gte(followupsTable.scheduledDate, today)));
  const [pendingInvoices] = await db.select({ count: sql<number>`count(*)` }).from(invoicesTable).where(eq(invoicesTable.paymentStatus, "pending"));
  const [revenueResult] = await db.select({ total: sql<string>`coalesce(sum(total::numeric), 0)` }).from(invoicesTable).where(eq(invoicesTable.paymentStatus, "paid"));

  res.json({
    totalPatients: Number(totalPatients.count),
    todayPatients: Number(todayPatients.count),
    activeOps: Number(activeOps.count),
    activeTreatments: Number(activeTreatments.count),
    upcomingFollowups: Number(upcomingFollowups.count),
    pendingInvoices: Number(pendingInvoices.count),
    totalRevenue: Number(revenueResult.total),
  });
});

router.get("/dashboard/recent-patients", async (_req, res) => {
  const patients = await db.select().from(patientsTable).orderBy(sql`${patientsTable.createdAt} desc`).limit(5);
  res.json(patients.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })));
});

router.get("/dashboard/today-appointments", async (_req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const ops = await db
    .select({
      id: opRecordsTable.id, opNumber: opRecordsTable.opNumber, patientId: opRecordsTable.patientId,
      startDate: opRecordsTable.startDate, expiryDate: opRecordsTable.expiryDate,
      status: opRecordsTable.status, visitReason: opRecordsTable.visitReason,
      createdAt: opRecordsTable.createdAt, patientName: patientsTable.fullName,
    })
    .from(opRecordsTable)
    .leftJoin(patientsTable, eq(opRecordsTable.patientId, patientsTable.id))
    .where(gte(opRecordsTable.createdAt, today))
    .orderBy(sql`${opRecordsTable.createdAt} desc`)
    .limit(10);
  res.json(ops.map((op) => ({ ...op, startDate: op.startDate.toISOString(), expiryDate: op.expiryDate.toISOString(), createdAt: op.createdAt.toISOString(), patientName: op.patientName ?? null })));
});

export default router;
