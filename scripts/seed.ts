/**
 * Seed script: creates the admin user and (optionally) sample data.
 *
 *   npm run seed                 admin + sample data (samples only if there are no patients yet)
 *   npm run seed -- --no-samples admin only (use this against the real clinic database)
 *
 * Env (in .env.local):
 *   MONGODB_URI           required
 *   SEED_ADMIN_EMAIL      required: the admin signs in with this email
 *   SEED_ADMIN_PASSWORD   if omitted for a new admin, a random password is generated and printed.
 *                         If set and the admin already exists, the password is reset to this value.
 */
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import mongoose, { type Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Admin, EMAIL_REGEX } from "@/models/Admin";
import { Patient } from "@/models/Patient";
import { Visit } from "@/models/Visit";
import { Medicine } from "@/models/Medicine";
import { Counter, nextSequence } from "@/models/Counter";
import { LoginAttempt } from "@/models/LoginAttempt";

const withSamples = !process.argv.includes("--no-samples");

/** UTC midnight, `days` from today. */
function day(days: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function seedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "").trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    throw new Error("Set SEED_ADMIN_EMAIL in .env.local to the admin's email address (used to sign in).");
  }
  const givenPassword = process.env.SEED_ADMIN_PASSWORD;
  const existing = await Admin.findOne({ email });

  if (existing && !givenPassword) {
    console.log(`✓ Admin ${email} already exists (password unchanged).`);
    return;
  }

  const password = givenPassword || randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 12);

  if (existing) {
    existing.passwordHash = passwordHash;
    await existing.save();
    console.log(`✓ Admin ${email}: password reset from SEED_ADMIN_PASSWORD.`);
  } else {
    await Admin.create({ email, passwordHash });
    console.log(`✓ Admin ${email} created.`);
    if (!givenPassword) console.log(`  Generated password: ${password}   <-- save this now, it is not stored anywhere`);
  }
}

async function seedSamples() {
  if ((await Patient.estimatedDocumentCount()) > 0) {
    console.log("• Patients already exist, skipping sample data.");
    return;
  }

  const meds = await Medicine.insertMany([
    {
      name: "Arnica Montana",
      form: "dilution",
      manufacturer: "Dr. Willmar Schwabe",
      batches: [
        { batchNumber: "AR-2301", expiryDate: day(-10), quantity: 2, purchaseDate: day(-700) }, // expired
        { batchNumber: "AR-2405", expiryDate: day(600), quantity: 12, purchaseDate: day(-60) },
      ],
    },
    {
      name: "Nux Vomica",
      form: "dilution",
      manufacturer: "SBL",
      batches: [{ batchNumber: "NV-1187", expiryDate: day(45), quantity: 6, purchaseDate: day(-500) }], // expiring soon
    },
    {
      name: "Belladonna",
      form: "dilution",
      manufacturer: "Dr. Reckeweg",
      batches: [{ batchNumber: "BE-3320", expiryDate: day(400), quantity: 8, purchaseDate: day(-30) }],
    },
    {
      name: "Calendula Officinalis",
      form: "mother tincture",
      manufacturer: "Dr. Willmar Schwabe",
      batches: [{ batchNumber: "CQ-0912", expiryDate: day(80), quantity: 4, purchaseDate: day(-400) }], // expiring soon
    },
    {
      name: "Ferrum Phosphoricum",
      form: "biochemic",
      manufacturer: "SBL",
      batches: [{ batchNumber: "FP-6X-551", expiryDate: day(900), quantity: 10, purchaseDate: day(-15) }],
    },
    {
      name: "Alfalfa Tonic",
      form: "tablets",
      manufacturer: "Dr. Reckeweg",
      batches: [{ batchNumber: "AT-7781", expiryDate: day(300), quantity: 5, purchaseDate: day(-90) }],
    },
  ]);
  const med = (name: string) => meds.find((m) => m.name === name)!._id as Types.ObjectId;
  console.log(`✓ ${meds.length} medicines`);

  // Make sure patient IDs start from 1 for a fresh database.
  await Counter.deleteOne({ _id: "patient" });
  const patientData = [
    { name: "Muhammad Ahmed", cnic: "35202-1234567-1", phone: "03001234567", gender: "male", age: 42, address: "Model Town, Lahore" },
    { name: "Ayesha Khan", phone: "03211234567", gender: "female", age: 29, address: "Gulberg, Lahore" },
    { name: "Fatima Bibi", cnic: "35201-7654321-2", gender: "female", age: 63, address: "Johar Town, Lahore" },
    { name: "Ali Raza", phone: "03451234567", gender: "male", age: 8, address: "DHA, Lahore" },
  ] as const;
  const ids: Types.ObjectId[] = [];
  for (const p of patientData) {
    const created = await Patient.create({ ...p, patientNo: await nextSequence("patient") });
    ids.push(created._id);
  }
  console.log(`✓ ${ids.length} patients`);

  const [ahmed, ayesha, fatima, ali] = ids;
  const visits = await Visit.insertMany([
    {
      patientId: ahmed,
      visitDate: day(-60),
      complaints: "Acidity and heartburn after meals, irritable, sleeps poorly",
      notes: "Sedentary job, coffee 4 cups/day. Worse morning, better after a nap.",
      followUpDate: day(-46),
      prescription: {
        items: [
          { medicineId: med("Nux Vomica"), medicineName: "Nux Vomica", potency: "30C", dose: "4 pills", frequency: "Thrice daily (TDS)", duration: "14 days" },
        ],
        generalInstructions: "Avoid coffee and spicy food. Keep 30 min gap from meals.",
      },
    },
    {
      patientId: ahmed,
      visitDate: day(-14),
      complaints: "Acidity improved ~70%. Mild bloating remains.",
      followUpDate: day(14),
      prescription: {
        items: [
          { medicineId: med("Nux Vomica"), medicineName: "Nux Vomica", potency: "200C", dose: "4 pills", frequency: "Weekly", duration: "4 weeks" },
        ],
        generalInstructions: "Continue diet restrictions.",
      },
    },
    {
      patientId: ayesha,
      visitDate: day(-3),
      complaints: "Sudden high fever with throbbing headache, red face",
      notes: "Onset yesterday evening. Light sensitive.",
      followUpDate: day(2),
      prescription: {
        items: [
          { medicineId: med("Belladonna"), medicineName: "Belladonna", potency: "30C", dose: "4 pills", frequency: "Every 4 hours", duration: "2 days" },
          { medicineId: med("Ferrum Phosphoricum"), medicineName: "Ferrum Phosphoricum", potency: "6X", dose: "2 tablets", frequency: "Thrice daily (TDS)", duration: "5 days", instructions: "Dissolve in mouth" },
        ],
        generalInstructions: "Plenty of fluids and rest. Return if fever persists beyond 48 hours.",
      },
    },
    {
      patientId: fatima,
      visitDate: day(-30),
      complaints: "Knee pain and bruising after a fall",
      prescription: {
        items: [
          { medicineId: med("Arnica Montana"), medicineName: "Arnica Montana", potency: "200C", dose: "4 pills", frequency: "Twice daily (BD)", duration: "7 days" },
          { medicineId: med("Calendula Officinalis"), medicineName: "Calendula Officinalis", potency: "Q", dose: "10 drops in water", frequency: "Twice daily (BD)", duration: "7 days", instructions: "External application on the scrape" },
        ],
      },
    },
    {
      patientId: ali,
      visitDate: day(0),
      complaints: "Poor appetite, weakness",
      prescription: {
        items: [
          { medicineId: med("Alfalfa Tonic"), medicineName: "Alfalfa Tonic", potency: "Q", dose: "1 teaspoon", frequency: "Twice daily (BD)", duration: "1 month" },
        ],
      },
    },
  ]);
  console.log(`✓ ${visits.length} visits`);
}

async function main() {
  await connectDB();
  // Build/align indexes (unique sparse CNIC/phone, text index, batches.expiryDate, ...).
  await Promise.all([Admin, Patient, Visit, Medicine, Counter, LoginAttempt].map((m) => m.syncIndexes()));
  console.log("✓ Indexes in sync");

  await seedAdmin();
  if (withSamples) await seedSamples();
  else console.log("• Skipping sample data (--no-samples)");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
