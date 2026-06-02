import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { followupsTable, treatmentsTable, invoicesTable, patientsTable } from "@workspace/db";
import { eq, lte, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/notifications", async (_req, res) => {
  const today = new Date();
  const notifications: any[] = [];

  // Overdue follow-ups
  const overdueFollowups = await db.select({
    id: followupsTable.id, patientId: followupsTable.patientId,
    scheduledDate: followupsTable.scheduledDate, patientName: patientsTable.fullName,
  }).from(followupsTable)
    .leftJoin(patientsTable, eq(followupsTable.patientId, patientsTable.id))
    .where(and(eq(followupsTable.status, "pending"), lte(followupsTable.scheduledDate, today)))
    .limit(20);

  overdueFollowups.forEach((fu) => {
    notifications.push({
      id: fu.id * 100,
      type: "followup",
      message: `Follow-up overdue for ${fu.patientName ?? "patient"}`,
      patientId: fu.patientId,
      patientName: fu.patientName ?? null,
      scheduledDate: fu.scheduledDate.toISOString(),
      createdAt: fu.scheduledDate.toISOString(),
    });
  });

  // Incomplete treatments
  const incompleteTreatments = await db.select({
    id: treatmentsTable.id, patientId: treatmentsTable.patientId,
    procedure: treatmentsTable.procedure, patientName: patientsTable.fullName,
  }).from(treatmentsTable)
    .leftJoin(patientsTable, eq(treatmentsTable.patientId, patientsTable.id))
    .where(eq(treatmentsTable.status, "planned"))
    .limit(20);

  incompleteTreatments.forEach((t) => {
    notifications.push({
      id: t.id * 100 + 1,
      type: "incomplete-treatment",
      message: `Planned treatment not started: ${t.procedure} for ${t.patientName ?? "patient"}`,
      patientId: t.patientId,
      patientName: t.patientName ?? null,
      scheduledDate: null,
      createdAt: new Date().toISOString(),
    });
  });

  // Pending invoices
  const pendingInvoices = await db.select({
    id: invoicesTable.id, patientId: invoicesTable.patientId,
    invoiceNumber: invoicesTable.invoiceNumber, total: invoicesTable.total,
    patientName: patientsTable.fullName,
  }).from(invoicesTable)
    .leftJoin(patientsTable, eq(invoicesTable.patientId, patientsTable.id))
    .where(eq(invoicesTable.paymentStatus, "pending"))
    .limit(20);

  pendingInvoices.forEach((inv) => {
    notifications.push({
      id: inv.id * 100 + 2,
      type: "pending-payment",
      message: `Invoice ${inv.invoiceNumber} pending payment: ₹${Number(inv.total).toLocaleString()}`,
      patientId: inv.patientId,
      patientName: inv.patientName ?? null,
      scheduledDate: null,
      createdAt: new Date().toISOString(),
    });
  });

  res.json(notifications);
});

export default router;
