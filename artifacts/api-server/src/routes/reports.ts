import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { patientsTable, opRecordsTable, treatmentsTable, invoicesTable } from "@workspace/db";
import { eq, gte, lte, and, sql } from "drizzle-orm";
import { GetDailyReportQueryParams, GetMonthlyReportQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/reports/daily", async (req, res) => {
  const parsed = GetDailyReportQueryParams.safeParse(req.query);
  const dateStr = (parsed.success && parsed.data.date) ? parsed.data.date : new Date().toISOString().slice(0, 10);
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

  const [newPatients] = await db.select({ count: sql<number>`count(*)` }).from(patientsTable).where(and(gte(patientsTable.createdAt, startOfDay), lte(patientsTable.createdAt, endOfDay)));
  const [totalVisits] = await db.select({ count: sql<number>`count(*)` }).from(opRecordsTable).where(and(gte(opRecordsTable.createdAt, startOfDay), lte(opRecordsTable.createdAt, endOfDay)));
  const [completedTreatments] = await db.select({ count: sql<number>`count(*)` }).from(treatmentsTable).where(and(eq(treatmentsTable.status, "completed"), gte(treatmentsTable.createdAt, startOfDay), lte(treatmentsTable.createdAt, endOfDay)));
  const [invoiceStats] = await db.select({ count: sql<number>`count(*)`, total: sql<string>`coalesce(sum(total::numeric), 0)` }).from(invoicesTable).where(and(gte(invoicesTable.createdAt, startOfDay), lte(invoicesTable.createdAt, endOfDay)));

  res.json({
    date: dateStr,
    newPatients: Number(newPatients.count),
    totalVisits: Number(totalVisits.count),
    completedTreatments: Number(completedTreatments.count),
    invoicesGenerated: Number(invoiceStats.count),
    totalRevenue: Number(invoiceStats.total),
  });
});

router.get("/reports/monthly", async (req, res) => {
  const parsed = GetMonthlyReportQueryParams.safeParse(req.query);
  const monthStr = (parsed.success && parsed.data.month) ? parsed.data.month : new Date().toISOString().slice(0, 7);
  const [year, month] = monthStr.split("-").map(Number);
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  const [totalPatients] = await db.select({ count: sql<number>`count(*)` }).from(patientsTable).where(and(gte(patientsTable.createdAt, startOfMonth), lte(patientsTable.createdAt, endOfMonth)));
  const [totalVisits] = await db.select({ count: sql<number>`count(*)` }).from(opRecordsTable).where(and(gte(opRecordsTable.createdAt, startOfMonth), lte(opRecordsTable.createdAt, endOfMonth)));
  const [revenueResult] = await db.select({ total: sql<string>`coalesce(sum(total::numeric), 0)` }).from(invoicesTable).where(and(eq(invoicesTable.paymentStatus, "paid"), gte(invoicesTable.createdAt, startOfMonth), lte(invoicesTable.createdAt, endOfMonth)));

  // Treatment breakdown
  const treatmentRows = await db.select({ procedure: treatmentsTable.procedure, count: sql<number>`count(*)` })
    .from(treatmentsTable).where(and(gte(treatmentsTable.createdAt, startOfMonth), lte(treatmentsTable.createdAt, endOfMonth)))
    .groupBy(treatmentsTable.procedure).limit(10);

  // Daily stats (simplified - use existing data)
  const daysInMonth = endOfMonth.getDate();
  const dailyStats = [];
  for (let d = 1; d <= Math.min(daysInMonth, 30); d++) {
    const dayStart = new Date(year, month - 1, d, 0, 0, 0);
    const dayEnd = new Date(year, month - 1, d, 23, 59, 59, 999);
    const [visits] = await db.select({ count: sql<number>`count(*)` }).from(opRecordsTable).where(and(gte(opRecordsTable.createdAt, dayStart), lte(opRecordsTable.createdAt, dayEnd)));
    const [rev] = await db.select({ total: sql<string>`coalesce(sum(total::numeric), 0)` }).from(invoicesTable).where(and(gte(invoicesTable.createdAt, dayStart), lte(invoicesTable.createdAt, dayEnd)));
    if (Number(visits.count) > 0 || Number(rev.total) > 0) {
      dailyStats.push({ date: `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`, visits: Number(visits.count), revenue: Number(rev.total) });
    }
  }

  res.json({
    month: monthStr,
    totalPatients: Number(totalPatients.count),
    totalVisits: Number(totalVisits.count),
    totalRevenue: Number(revenueResult.total),
    treatmentBreakdown: treatmentRows.map((r) => ({ procedure: r.procedure, count: Number(r.count) })),
    dailyStats,
  });
});

export default router;
