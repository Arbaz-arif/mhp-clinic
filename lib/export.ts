import "server-only";
import { connectDB } from "@/lib/db";
import { toCsv } from "@/lib/csv";
import { daysUntil } from "@/lib/utils";
import { Patient } from "@/models/Patient";
import { Visit } from "@/models/Visit";
import { Medicine } from "@/models/Medicine";

export const EXPORT_TYPES = ["patients", "visits", "medicines"] as const;
export type ExportType = (typeof EXPORT_TYPES)[number];

const day = (d?: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");

/** All patients, by patient #. */
async function patientsCsv() {
  const rows = await Patient.find().sort({ patientNo: 1 }).lean();
  return toCsv(
    ["Patient #", "Name", "CNIC", "Mobile", "Gender", "Age", "Address", "Registered", "Last updated", "Record ID"],
    rows.map((p) => [
      p.patientNo,
      p.name,
      p.cnic,
      p.phone,
      p.gender,
      p.age,
      p.address,
      day(p.createdAt),
      day(p.updatedAt),
      String(p._id),
    ]),
  );
}

/** One row per visit, with the patient's details joined in and medicines in one cell. */
async function visitsCsv() {
  const rows = await Visit.aggregate<{
    _id: unknown;
    visitDate: Date;
    complaints: string;
    notes?: string;
    followUpDate?: Date;
    prescription?: {
      items?: { medicineName: string; potency: string; dose: string; frequency: string; duration: string; instructions?: string }[];
      generalInstructions?: string;
    };
    patient?: { patientNo: number; name: string; cnic?: string; phone?: string };
  }>([
    { $sort: { visitDate: -1, createdAt: -1 } },
    { $lookup: { from: "patients", localField: "patientId", foreignField: "_id", as: "patient" } },
    { $set: { patient: { $first: "$patient" } } },
  ]);

  return toCsv(
    [
      "Visit date",
      "Patient #",
      "Patient name",
      "CNIC",
      "Mobile",
      "Complaints",
      "Notes",
      "Medicines",
      "General instructions",
      "Follow-up",
      "Visit ID",
    ],
    rows.map((v) => [
      day(v.visitDate),
      v.patient?.patientNo,
      v.patient?.name ?? "(deleted patient)",
      v.patient?.cnic,
      v.patient?.phone,
      v.complaints,
      v.notes,
      (v.prescription?.items ?? [])
        .map(
          (i) =>
            `${i.medicineName} ${i.potency}: ${i.dose}, ${i.frequency}, ${i.duration}` +
            (i.instructions ? ` (${i.instructions})` : ""),
        )
        .join(" | "),
      v.prescription?.generalInstructions,
      day(v.followUpDate),
      String(v._id),
    ]),
  );
}

/** One row per batch ($unwind); medicines without batches still get one row. */
async function medicinesCsv() {
  const rows = await Medicine.aggregate<{
    name: string;
    form: string;
    manufacturer?: string;
    batch?: { batchNumber: string; expiryDate: Date; quantity: number; purchaseDate?: Date };
  }>([
    { $unwind: { path: "$batches", preserveNullAndEmptyArrays: true } },
    { $sort: { name: 1, "batches.expiryDate": 1 } },
    { $project: { name: 1, form: 1, manufacturer: 1, batch: "$batches" } },
  ]);

  return toCsv(
    ["Medicine", "Form", "Manufacturer", "Batch", "Expiry date", "Quantity", "Purchase date", "Status"],
    rows.map((r) => {
      const left = r.batch ? daysUntil(r.batch.expiryDate) : null;
      const status = left == null ? "" : left < 0 ? "Expired" : left <= 90 ? `${left} days left` : "OK";
      return [
        r.name,
        r.form,
        r.manufacturer,
        r.batch?.batchNumber,
        day(r.batch?.expiryDate),
        r.batch?.quantity,
        day(r.batch?.purchaseDate),
        status,
      ];
    }),
  );
}

export async function buildExport(type: ExportType): Promise<string> {
  await connectDB();
  if (type === "patients") return patientsCsv();
  if (type === "visits") return visitsCsv();
  return medicinesCsv();
}
