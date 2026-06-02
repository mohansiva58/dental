import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const diagnosesTable = pgTable("diagnoses", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  opRecordId: integer("op_record_id"),
  notes: text("notes").notNull(),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDiagnosisSchema = createInsertSchema(diagnosesTable).omit({ id: true, createdAt: true });
export type InsertDiagnosis = z.infer<typeof insertDiagnosisSchema>;
export type Diagnosis = typeof diagnosesTable.$inferSelect;
