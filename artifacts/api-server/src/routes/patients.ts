import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { patientsTable } from "@workspace/db";
import { eq, or, ilike } from "drizzle-orm";
import { CreatePatientBody, GetPatientParams, UpdatePatientParams, UpdatePatientBody, ListPatientsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

async function generatePatientId(): Promise<string> {
  const patients = await db.select({ patientId: patientsTable.patientId }).from(patientsTable).orderBy(patientsTable.id);
  const count = patients.length + 1;
  return `PT-${String(count).padStart(4, "0")}`;
}

router.get("/patients", async (req, res) => {
  const parsed = ListPatientsQueryParams.safeParse(req.query);
  const { search, status } = parsed.success ? parsed.data : { search: undefined, status: undefined };
  let query = db.select().from(patientsTable).$dynamic();
  if (search) {
    query = query.where(or(ilike(patientsTable.fullName, `%${search}%`), ilike(patientsTable.contactNumber, `%${search}%`), ilike(patientsTable.patientId, `%${search}%`)));
  } else if (status) {
    query = query.where(eq(patientsTable.status, status));
  }
  const patients = await query.orderBy(patientsTable.createdAt);
  res.json(patients.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })));
});

router.post("/patients", async (req, res) => {
  const parsed = CreatePatientBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body", details: parsed.error.issues }); return; }
  const patientId = await generatePatientId();
  const [patient] = await db.insert(patientsTable).values({ ...parsed.data, patientId }).returning();
  res.status(201).json({ ...patient, createdAt: patient.createdAt.toISOString() });
});

router.get("/patients/:id", async (req, res) => {
  const parsed = GetPatientParams.safeParse({ id: parseInt(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, parsed.data.id));
  if (!patient) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...patient, createdAt: patient.createdAt.toISOString() });
});

router.patch("/patients/:id", async (req, res) => {
  const paramsParsed = UpdatePatientParams.safeParse({ id: parseInt(req.params.id) });
  if (!paramsParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const bodyParsed = UpdatePatientBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const [patient] = await db.update(patientsTable).set(bodyParsed.data).where(eq(patientsTable.id, paramsParsed.data.id)).returning();
  if (!patient) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...patient, createdAt: patient.createdAt.toISOString() });
});

export default router;
