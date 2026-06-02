import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const followupsTable = pgTable("followups", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  scheduledDate: timestamp("scheduled_date", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFollowupSchema = createInsertSchema(followupsTable).omit({ id: true, createdAt: true });
export type InsertFollowup = z.infer<typeof insertFollowupSchema>;
export type Followup = typeof followupsTable.$inferSelect;
