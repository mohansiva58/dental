import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const revisitsTable = pgTable("revisits", {
  id: serial("id").primaryKey(),
  opRecordId: integer("op_record_id").notNull(),
  visitDate: timestamp("visit_date", { withTimezone: true }).notNull(),
  notes: text("notes"),
  doctorId: integer("doctor_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRevisitSchema = createInsertSchema(revisitsTable).omit({ id: true, createdAt: true });
export type InsertRevisit = z.infer<typeof insertRevisitSchema>;
export type Revisit = typeof revisitsTable.$inferSelect;
