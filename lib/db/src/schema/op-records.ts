import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const opRecordsTable = pgTable("op_records", {
  id: serial("id").primaryKey(),
  opNumber: text("op_number").notNull().unique(),
  patientId: integer("patient_id").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull().defaultNow(),
  expiryDate: timestamp("expiry_date", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("active"),
  visitReason: text("visit_reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOpRecordSchema = createInsertSchema(opRecordsTable).omit({ id: true, createdAt: true });
export type InsertOpRecord = z.infer<typeof insertOpRecordSchema>;
export type OpRecord = typeof opRecordsTable.$inferSelect;
