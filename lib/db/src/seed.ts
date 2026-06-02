import { db, pool } from "./index";
import {
  usersTable, patientsTable, opRecordsTable, treatmentsTable,
  diagnosesTable, prescriptionsTable, followupsTable, invoicesTable
} from "./schema";

async function seed() {
  const existing = await db.select().from(usersTable);
  if (existing.length > 0) {
    console.log("Already seeded, skipping");
    await pool.end();
    return;
  }

  // Users
  await db.insert(usersTable).values([
    { username: "admin", hashedPassword: "admin123", fullName: "Dr. Admin User", role: "administrator", status: "active" },
    { username: "receptionist", hashedPassword: "recept123", fullName: "Sarah Johnson", role: "receptionist", status: "active" },
    { username: "doctor", hashedPassword: "doctor123", fullName: "Dr. Michael Smith", role: "doctor", status: "active" },
  ]);

  // Patients
  const patients = await db.insert(patientsTable).values([
    { patientId: "PT-0001", fullName: "Ramesh Kumar", age: 42, gender: "male", contactNumber: "9876543210", email: "ramesh@example.com", bloodGroup: "O+", status: "active" },
    { patientId: "PT-0002", fullName: "Priya Sharma", age: 35, gender: "female", contactNumber: "9876543211", email: "priya@example.com", bloodGroup: "A+", status: "active" },
    { patientId: "PT-0003", fullName: "Vijay Patel", age: 28, gender: "male", contactNumber: "9876543212", bloodGroup: "B+", status: "active" },
    { patientId: "PT-0004", fullName: "Sunita Devi", age: 55, gender: "female", contactNumber: "9876543213", bloodGroup: "AB-", status: "active" },
    { patientId: "PT-0005", fullName: "Arjun Mehta", age: 19, gender: "male", contactNumber: "9876543214", email: "arjun@example.com", bloodGroup: "O-", status: "active" },
  ]).returning();

  const now = new Date();
  const expiry = new Date(now); expiry.setDate(expiry.getDate() + 15);
  const expiredStart = new Date(now); expiredStart.setDate(expiredStart.getDate() - 20);
  const expiredExpiry = new Date(now); expiredExpiry.setDate(expiredExpiry.getDate() - 5);
  const past2 = new Date(now); past2.setDate(past2.getDate() - 2);
  const expiry2 = new Date(now); expiry2.setDate(expiry2.getDate() + 13);

  const ops = await db.insert(opRecordsTable).values([
    { opNumber: "OP2026050001", patientId: patients[0].id, startDate: now, expiryDate: expiry, status: "active", visitReason: "Tooth pain" },
    { opNumber: "OP2026050002", patientId: patients[1].id, startDate: now, expiryDate: expiry, status: "active", visitReason: "Routine checkup" },
    { opNumber: "OP2026040003", patientId: patients[2].id, startDate: expiredStart, expiryDate: expiredExpiry, status: "expired", visitReason: "Cavity treatment" },
    { opNumber: "OP2026050004", patientId: patients[3].id, startDate: now, expiryDate: expiry, status: "active", visitReason: "Gum disease" },
    { opNumber: "OP2026050005", patientId: patients[4].id, startDate: past2, expiryDate: expiry2, status: "active", visitReason: "Orthodontic consultation" },
  ]).returning();

  await db.insert(treatmentsTable).values([
    { patientId: patients[0].id, toothNumber: "16", procedure: "Root Canal Treatment", status: "in-progress", cost: "8000" },
    { patientId: patients[0].id, toothNumber: "17", procedure: "Crown Placement", status: "planned", cost: "5000" },
    { patientId: patients[1].id, toothNumber: "11", procedure: "Teeth Whitening", status: "completed", cost: "3000" },
    { patientId: patients[2].id, toothNumber: "26", procedure: "Cavity Filling", status: "completed", cost: "1500" },
    { patientId: patients[3].id, procedure: "Scaling and Polishing", status: "in-progress", cost: "2000" },
    { patientId: patients[4].id, procedure: "Braces - Upper Jaw", status: "planned", cost: "25000" },
  ]);

  await db.insert(diagnosesTable).values([
    { patientId: patients[0].id, opRecordId: ops[0].id, notes: "Deep caries in tooth 16 requiring root canal. Periapical abscess noted on X-ray." },
    { patientId: patients[1].id, opRecordId: ops[1].id, notes: "Good oral hygiene. Minor calculus deposits. Recommended professional cleaning." },
    { patientId: patients[3].id, opRecordId: ops[3].id, notes: "Moderate gingivitis. Bleeding on probing. Patient counselled on brushing technique." },
  ]);

  await db.insert(prescriptionsTable).values([
    { patientId: patients[0].id, medicineName: "Amoxicillin", dosage: "500mg", instructions: "Three times daily after meals for 5 days" },
    { patientId: patients[0].id, medicineName: "Ibuprofen", dosage: "400mg", instructions: "Twice daily for pain relief" },
    { patientId: patients[3].id, medicineName: "Chlorhexidine Mouthwash", dosage: "15ml", instructions: "Rinse twice daily for 2 weeks" },
  ]);

  const fu1 = new Date(now); fu1.setDate(fu1.getDate() + 7);
  const fu2 = new Date(now); fu2.setDate(fu2.getDate() + 14);
  const fu3 = new Date(now); fu3.setDate(fu3.getDate() - 3);

  await db.insert(followupsTable).values([
    { patientId: patients[0].id, scheduledDate: fu1, status: "pending", notes: "Check root canal progress" },
    { patientId: patients[1].id, scheduledDate: fu2, status: "pending", notes: "Post-cleaning review" },
    { patientId: patients[2].id, scheduledDate: fu3, status: "pending", notes: "Post-filling checkup" },
    { patientId: patients[3].id, scheduledDate: fu1, status: "pending", notes: "Gum treatment follow-up" },
  ]);

  await db.insert(invoicesTable).values([
    { invoiceNumber: "INV202605001", patientId: patients[0].id, items: [{ description: "Root Canal Consultation", quantity: 1, unitPrice: 500, amount: 500 }], subtotal: "500", total: "500", paymentStatus: "paid", paymentMethod: "Cash" },
    { invoiceNumber: "INV202605002", patientId: patients[1].id, items: [{ description: "Teeth Whitening", quantity: 1, unitPrice: 3000, amount: 3000 }], subtotal: "3000", total: "3000", paymentStatus: "paid", paymentMethod: "Card" },
    { invoiceNumber: "INV202605003", patientId: patients[2].id, items: [{ description: "Cavity Filling", quantity: 1, unitPrice: 1500, amount: 1500 }], subtotal: "1500", total: "1500", paymentStatus: "pending" },
    { invoiceNumber: "INV202605004", patientId: patients[3].id, items: [{ description: "Scaling and Polishing", quantity: 1, unitPrice: 2000, amount: 2000 }], subtotal: "2000", total: "2000", paymentStatus: "pending" },
    { invoiceNumber: "INV202605005", patientId: patients[4].id, items: [{ description: "Orthodontic Consultation", quantity: 1, unitPrice: 500, amount: 500 }], subtotal: "500", total: "500", paymentStatus: "paid", paymentMethod: "UPI" },
  ]);

  console.log("Seeded successfully!");
  await pool.end();
}

seed().catch((e) => { console.error("Seed failed:", e.message); process.exit(1); });
