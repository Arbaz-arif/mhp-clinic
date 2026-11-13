"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { Patient } from "@/models/Patient";
import { Visit } from "@/models/Visit";
import { Medicine } from "@/models/Medicine";
import { visitSchema, zodErrors, type FormState } from "@/lib/validation";
import type { z } from "zod";

function readForm(formData: FormData) {
  let items: unknown = [];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    items = [];
  }
  return visitSchema.safeParse({
    visitDate: formData.get("visitDate") ?? "",
    complaints: formData.get("complaints") ?? "",
    notes: formData.get("notes") ?? "",
    followUpDate: formData.get("followUpDate") ?? "",
    prescription: { items, generalInstructions: formData.get("generalInstructions") ?? "" },
  });
}

type ParsedVisit = z.output<typeof visitSchema>;

/**
 * Trust the database, not the browser: keep medicineId only if that medicine exists,
 * and take medicineName from the Medicine record. Unknown ids (e.g. a medicine deleted
 * since the last visit, via "Repeat last prescription") are dropped, keeping the name as text.
 */
async function linkMedicines(data: ParsedVisit): Promise<ParsedVisit> {
  const ids = [...new Set(data.prescription.items.map((i) => i.medicineId).filter((id): id is string => !!id))];
  const found = ids.length ? await Medicine.find({ _id: { $in: ids } }, { name: 1 }).lean() : [];
  const names = new Map(found.map((m) => [String(m._id), m.name]));

  const items = data.prescription.items.map((item) => {
    const name = item.medicineId ? names.get(item.medicineId) : undefined;
    return name ? { ...item, medicineName: name } : { ...item, medicineId: undefined };
  });
  return { ...data, prescription: { ...data.prescription, items } };
}

function withPrescriptionMessage(state: FormState): FormState {
  // Nested item errors are flattened under "prescription"; show one clear message.
  if (state.errors?.prescription) {
    const tooMany = state.errors.prescription.find((m) => m.startsWith("At most"));
    state.errors.prescription = [tooMany ?? "Every medicine row needs name, potency, dose, frequency and duration"];
  }
  return state;
}

export async function createVisit(patientId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  if (!isValidObjectId(patientId)) return { ok: false, message: "Invalid patient" };
  const parsed = readForm(formData);
  if (!parsed.success) return withPrescriptionMessage(zodErrors(parsed.error));

  await connectDB();
  if (!(await Patient.exists({ _id: patientId }))) return { ok: false, message: "Patient not found" };

  await Visit.create({ ...(await linkMedicines(parsed.data)), patientId });
  await Patient.updateOne({ _id: patientId }, { $currentDate: { updatedAt: true } });
  revalidatePath(`/patients/${patientId}`, "layout");
  redirect(`/patients/${patientId}`);
}

export async function updateVisit(visitId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  if (!isValidObjectId(visitId)) return { ok: false, message: "Invalid visit" };
  const parsed = readForm(formData);
  if (!parsed.success) return withPrescriptionMessage(zodErrors(parsed.error));

  await connectDB();
  const visit = await Visit.findById(visitId);
  if (!visit) return { ok: false, message: "Visit not found" };
  const d = await linkMedicines(parsed.data);
  visit.set({
    visitDate: d.visitDate,
    complaints: d.complaints,
    notes: d.notes,
    followUpDate: d.followUpDate,
    prescription: d.prescription,
  });
  await visit.save();

  revalidatePath(`/patients/${visit.patientId}`, "layout"); // profile + all-visits list
  revalidatePath(`/visits/${visitId}`);
  redirect(`/visits/${visitId}`);
}

export async function deleteVisit(visitId: string) {
  await requireAdmin();
  if (!isValidObjectId(visitId)) return;
  await connectDB();
  const visit = await Visit.findByIdAndDelete(visitId);
  if (!visit) redirect("/patients");
  revalidatePath(`/patients/${visit.patientId}`, "layout");
  redirect(`/patients/${visit.patientId}`);
}
