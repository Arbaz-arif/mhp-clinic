import "server-only";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { Patient } from "@/models/Patient";
import { Visit } from "@/models/Visit";
import { Medicine } from "@/models/Medicine";
import { addDays, escapeRegex, startOfTodayUTC } from "@/lib/utils";
import { EXPIRY_CRITICAL_DAYS, EXPIRY_WARNING_DAYS } from "@/lib/constants";
import { normalizeCnic } from "@/lib/validation";

// ---------- Plain, serializable shapes passed to components ----------

export type PatientDTO = {
  id: string;
  patientNo: number;
  name: string;
  cnic?: string;
  phone?: string;
  gender?: string;
  age?: number;
  address?: string;
};

export type PrescriptionItemDTO = {
  medicineId?: string;
  medicineName: string;
  potency: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions?: string;
};

export type VisitDTO = {
  id: string;
  patientId: string;
  visitDate: string;
  complaints: string;
  notes?: string;
  followUpDate?: string;
  prescription: { items: PrescriptionItemDTO[]; generalInstructions?: string };
};

export type BatchDTO = {
  id: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchaseDate?: string;
};

export type MedicineDTO = {
  id: string;
  name: string;
  form: string;
  manufacturer?: string;
  batches: BatchDTO[];
};

/** One row per batch, for the expiry alerts. */
export type ExpiringBatchDTO = BatchDTO & { medicineId: string; medicineName: string; form: string };

/* eslint-disable @typescript-eslint/no-explicit-any */
const iso = (d: any) => (d ? new Date(d).toISOString() : undefined);
const opt = (v: any) => (v == null || v === "" ? undefined : String(v));

function toPatient(p: any): PatientDTO {
  return {
    id: String(p._id),
    patientNo: p.patientNo,
    name: p.name,
    cnic: opt(p.cnic),
    phone: opt(p.phone),
    gender: opt(p.gender),
    age: typeof p.age === "number" ? p.age : undefined,
    address: opt(p.address),
  };
}

function toVisit(v: any): VisitDTO {
  return {
    id: String(v._id),
    patientId: String(v.patientId),
    visitDate: iso(v.visitDate)!,
    complaints: v.complaints,
    notes: opt(v.notes),
    followUpDate: iso(v.followUpDate),
    prescription: {
      generalInstructions: opt(v.prescription?.generalInstructions),
      items: (v.prescription?.items ?? []).map((r: any) => ({
        medicineId: r.medicineId ? String(r.medicineId) : undefined,
        medicineName: r.medicineName,
        potency: r.potency,
        dose: r.dose,
        frequency: r.frequency,
        duration: r.duration,
        instructions: opt(r.instructions),
      })),
    },
  };
}

function toBatch(b: any): BatchDTO {
  return {
    id: String(b._id),
    batchNumber: b.batchNumber,
    expiryDate: iso(b.expiryDate)!,
    quantity: b.quantity,
    purchaseDate: iso(b.purchaseDate),
  };
}

function toMedicine(m: any): MedicineDTO {
  return {
    id: String(m._id),
    name: m.name,
    form: m.form,
    manufacturer: opt(m.manufacturer),
    batches: (m.batches ?? [])
      .map(toBatch)
      .sort((a: BatchDTO, b: BatchDTO) => a.expiryDate.localeCompare(b.expiryDate)),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------- Patients ----------

export const SEARCH_LIMIT = 50;

/**
 * One search box, matched with OR against:
 *  - _id         exact 24-hex ObjectId
 *  - name        partial, case-insensitive regex ("ayes" → "Ayesha Khan")
 *  - phone       partial digits ("1234567", "0300-12", "+92 300...")
 *  - patientNo / CNIC as a convenience when the input is numeric
 * The input is regex-escaped, so characters like "(" or "." are matched literally.
 */
export async function searchPatients(q: string) {
  await connectDB();
  const term = q.trim().slice(0, 100);
  if (!term) {
    return (await Patient.find().sort({ updatedAt: -1 }).limit(SEARCH_LIMIT).lean()).map(toPatient);
  }

  const or: Record<string, unknown>[] = [{ name: { $regex: escapeRegex(term), $options: "i" } }];

  // Note: mongoose's isValidObjectId() also accepts any 12-character string, so check the 24-hex form.
  if (/^[a-f\d]{24}$/i.test(term)) or.push({ _id: term });

  if (/^[#\d\s()+-]+$/.test(term)) {
    let digits = term.replace(/\D/g, "");
    if (/^\+?92/.test(term) && digits.length > 3) digits = "0" + digits.slice(2); // +92 300… → 0300…
    if (digits.length >= 3) or.push({ phone: { $regex: escapeRegex(digits) } });
    if (digits.length >= 5) {
      or.push({ cnic: { $regex: "^" + escapeRegex(digits.length === 13 ? normalizeCnic(term) : term) } });
    }
    if (digits.length >= 1 && digits.length <= 7) or.push({ patientNo: Number(term.replace(/\D/g, "")) });
  }

  const results = await Patient.find({ $or: or }).sort({ name: 1 }).limit(SEARCH_LIMIT).lean();
  return results.map(toPatient);
}

export const PATIENTS_PER_PAGE = 25;

/** All patients, newest registrations first, one page at a time. */
export async function listPatients(page = 1) {
  await connectDB();
  const total = await Patient.countDocuments();
  const pages = Math.max(1, Math.ceil(total / PATIENTS_PER_PAGE));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  const patients = await Patient.find()
    .sort({ patientNo: -1 })
    .skip((current - 1) * PATIENTS_PER_PAGE)
    .limit(PATIENTS_PER_PAGE)
    .lean();
  return { patients: patients.map(toPatient), total, page: current, pages };
}

export async function getPatient(id: string) {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  const p = await Patient.findById(id).lean();
  return p ? toPatient(p) : null;
}

export async function countPatients() {
  await connectDB();
  return Patient.estimatedDocumentCount();
}

// ---------- Visits ----------

export async function getVisitsForPatient(patientId: string, limit?: number) {
  await connectDB();
  const query = Visit.find({ patientId }).sort({ visitDate: -1, createdAt: -1 });
  if (limit) query.limit(limit);
  return (await query.lean()).map(toVisit);
}

export type PreviousPrescription = { visitId: string; visitDate: string } & VisitDTO["prescription"];

/**
 * The most recent earlier visit's prescription (for "Repeat last prescription").
 * Pass `excludeVisit` when editing, so we look only at visits before that one.
 */
export async function getPreviousPrescription(
  patientId: string,
  excludeVisit?: { id: string; visitDate: string },
): Promise<PreviousPrescription | null> {
  if (!isValidObjectId(patientId)) return null;
  await connectDB();
  const filter: Record<string, unknown> = { patientId, "prescription.items.0": { $exists: true } };
  if (excludeVisit) {
    filter._id = { $ne: excludeVisit.id };
    filter.visitDate = { $lte: new Date(excludeVisit.visitDate) };
  }
  const v = await Visit.findOne(filter).sort({ visitDate: -1, createdAt: -1 }).lean();
  if (!v) return null;
  const dto = toVisit(v);
  return { visitId: dto.id, visitDate: dto.visitDate, ...dto.prescription };
}

export type RecentVisitDTO = {
  id: string;
  visitDate: string;
  complaints: string;
  medicines: string[]; // "Nux Vomica 30C"
  followUpDate?: string;
  patient: { id: string; name: string; patientNo: number } | null; // null if the patient was deleted
};

/** Latest visits across all patients, with the patient's name via populate(). */
export async function getRecentVisits(limit = 10): Promise<RecentVisitDTO[]> {
  return findVisitsWithPatient({}, limit);
}

/** Every visit on one day (date = UTC midnight of that day), earliest recorded first. */
export async function getVisitsOn(day: Date): Promise<RecentVisitDTO[]> {
  return findVisitsWithPatient({ visitDate: day }, 500, { createdAt: 1 });
}

async function findVisitsWithPatient(
  filter: Record<string, unknown>,
  limit: number,
  sort: Record<string, 1 | -1> = { visitDate: -1, createdAt: -1 },
): Promise<RecentVisitDTO[]> {
  await connectDB();
  type PopulatedPatient = { _id: unknown; name: string; patientNo: number } | null;
  const visits = await Visit.find(filter, { visitDate: 1, complaints: 1, followUpDate: 1, prescription: 1, patientId: 1 })
    .sort(sort)
    .limit(limit)
    .populate<{ patientId: PopulatedPatient }>("patientId", "name patientNo")
    .lean();

  return visits.map((v) => ({
    id: String(v._id),
    visitDate: iso(v.visitDate)!,
    complaints: v.complaints,
    medicines: (v.prescription?.items ?? []).map((i) => `${i.medicineName} ${i.potency}`),
    followUpDate: iso(v.followUpDate),
    patient: v.patientId ? { id: String(v.patientId._id), name: v.patientId.name, patientNo: v.patientId.patientNo } : null,
  }));
}

export async function countVisitsForPatient(patientId: string) {
  await connectDB();
  return Visit.countDocuments({ patientId });
}

export async function getVisit(id: string) {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  const v = await Visit.findById(id).lean();
  return v ? toVisit(v) : null;
}

export async function countVisitsToday() {
  await connectDB();
  return Visit.countDocuments({ visitDate: startOfTodayUTC() });
}

// ---------- Medicines ----------

export async function listMedicines(q = "") {
  await connectDB();
  const term = q.trim();
  const filter = term
    ? {
        $or: [
          { name: { $regex: escapeRegex(term), $options: "i" } },
          { manufacturer: { $regex: escapeRegex(term), $options: "i" } },
          { "batches.batchNumber": { $regex: escapeRegex(term), $options: "i" } },
        ],
      }
    : {};
  return (await Medicine.find(filter).sort({ name: 1 }).lean()).map(toMedicine);
}

export async function getMedicine(id: string) {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  const m = await Medicine.findById(id).lean();
  return m ? toMedicine(m) : null;
}

export type MedicineOption = { id: string; name: string; form: string; manufacturer?: string; stock: number };

/** Inventory options for the prescription dropdown. `stock` counts only unexpired batches. */
export async function medicineOptions(): Promise<MedicineOption[]> {
  await connectDB();
  const today = startOfTodayUTC();
  const meds = await Medicine.find({}, { name: 1, form: 1, manufacturer: 1, batches: 1 }).sort({ name: 1 }).lean();
  return meds.map((m) => ({
    id: String(m._id),
    name: m.name,
    form: m.form as string,
    manufacturer: opt(m.manufacturer),
    stock: (m.batches ?? []).filter((b) => b.expiryDate >= today).reduce((sum, b) => sum + (b.quantity ?? 0), 0),
  }));
}

export const BATCH_FILTERS = ["all", "expired", "critical", "warning"] as const;
export type BatchFilter = (typeof BATCH_FILTERS)[number];

/**
 * One row per batch via $unwind.
 *  - filter: all | expired (before today) | critical (under 30 days) | warning (30 to 90 days)
 *    (same boundaries as the red / orange / yellow expiry levels)
 *  - q: medicine name / manufacturer / batch number
 *  - dir: sort by expiry date, ascending (soonest first) or descending
 *  - inStockOnly: skip batches with quantity 0
 */
export async function listBatches({
  filter = "all",
  q = "",
  dir = "asc",
  inStockOnly = false,
}: {
  filter?: BatchFilter;
  q?: string;
  dir?: "asc" | "desc";
  inStockOnly?: boolean;
} = {}): Promise<ExpiringBatchDTO[]> {
  await connectDB();
  const today = startOfTodayUTC();
  const critical = addDays(today, EXPIRY_CRITICAL_DAYS);
  const cutoff = addDays(today, EXPIRY_WARNING_DAYS);

  const expiry =
    filter === "expired"
      ? { $lt: today }
      : filter === "critical"
        ? { $gte: today, $lt: critical }
        : filter === "warning"
          ? { $gte: critical, $lte: cutoff }
          : undefined;
  const term = q.trim() ? { $regex: escapeRegex(q.trim()), $options: "i" } : undefined;

  const batchMatch: Record<string, unknown> = {};
  if (expiry) batchMatch["batches.expiryDate"] = expiry;
  if (inStockOnly) batchMatch["batches.quantity"] = { $gt: 0 };
  if (term) batchMatch.$or = [{ name: term }, { manufacturer: term }, { "batches.batchNumber": term }];

  const rows = await Medicine.aggregate([
    // Pre-filter whole documents first (can use the batches.expiryDate index)...
    ...(expiry ? [{ $match: { "batches.expiryDate": expiry } }] : []),
    { $unwind: "$batches" },
    // ...then filter the individual batch rows.
    ...(Object.keys(batchMatch).length ? [{ $match: batchMatch }] : []),
    { $sort: { "batches.expiryDate": dir === "desc" ? -1 : 1, name: 1, "batches.batchNumber": 1 } },
    { $project: { name: 1, form: 1, batch: "$batches" } },
  ]);
  return rows.map((r) => ({ ...toBatch(r.batch), medicineId: String(r._id), medicineName: r.name, form: r.form }));
}
// Expiry alerts (expired + expiring within 90 days) live in lib/expiry.ts → getExpiryReport().
