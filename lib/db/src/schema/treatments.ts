import { pgTable, text, serial, integer, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const treatmentsTable = pgTable("treatments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  toothNumber: text("tooth_number"),
  procedure: text("procedure").notNull(),
  status: text("status").notNull().default("planned"),
  cost: numeric("cost", { precision: 10, scale: 2 }),
  timelineOrder: integer("timeline_order"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTreatmentSchema = createInsertSchema(treatmentsTable).omit({ id: true, createdAt: true });
export type InsertTreatment = z.infer<typeof insertTreatmentSchema>;
export type Treatment = typeof treatmentsTable.$inferSelect;
