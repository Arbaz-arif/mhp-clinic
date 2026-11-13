"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { Patient } from "@/models/Patient";
import { Visit } from "@/models/Visit";
import { nextSequence } from "@/models/Counter";
import { patientSchema, zodErrors, type FormState } from "@/lib/validation";

function readForm(formData: FormData) {
  return patientSchema.safeParse({
    name: formData.get("name") ?? "",
    cnic: formData.get("cnic") ?? "",
    phone: formData.get("phone") ?? "",
    gender: formData.get("gender") ?? "",
    age: formData.get("age") ?? "",
    address: formData.get("address") ?? "",
  });
}

const DUPLICATE_LABELS = { cnic: "CNIC", phone: "mobile number" } as const;

/**
 * Turn a MongoDB duplicate-key error (code 11000) into a clear field error,
 * naming the patient who already has that CNIC / mobile number.
 */
async function duplicateError(err: unknown): Promise<FormState | null> {
  const e = err as { code?: number; keyPattern?: Record<string, unknown>; keyValue?: Record<string, unknown> };
  if (e?.code !== 11000) return null;

  const field = e.keyPattern?.cnic ? "cnic" : e.keyPattern?.phone ? "phone" : null;
  if (!field) return { ok: false, message: "This record already exists. Please try again." };

  const existing = await Patient.findOne({ [field]: e.keyValue?.[field] }, { name: 1, patientNo: 1 }).lean();
  const owner = existing ? ` to ${existing.name} (#${existing.patientNo})` : "";
  return { ok: false, errors: { [field]: [`This ${DUPLICATE_LABELS[field]} is already registered${owner}.`] } };
}

export async function createPatient(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = readForm(formData);
  if (!parsed.success) return zodErrors(parsed.error);

  await connectDB();
  let id: string;
  try {
    const patient = await Patient.create({ ...parsed.data, patientNo: await nextSequence("patient") });
    id = String(patient._id);
  } catch (err) {
    const dup = await duplicateError(err);
    if (dup) return dup;
    throw err;
  }
  revalidatePath("/patients");
  redirect(`/patients/${id}`);
}

export async function updatePatient(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  if (!isValidObjectId(id)) return { ok: false, message: "Invalid patient" };
  const parsed = readForm(formData);
  if (!parsed.success) return zodErrors(parsed.error);

  await connectDB();
  const patient = await Patient.findById(id);
  if (!patient) return { ok: false, message: "Patient not found" };

  // Setting a field to undefined makes Mongoose $unset it (keeps the unique indexes happy).
  patient.set({
    name: parsed.data.name,
    cnic: parsed.data.cnic,
    phone: parsed.data.phone,
    gender: parsed.data.gender,
    age: parsed.data.age,
    address: parsed.data.address,
  });
  try {
    await patient.save();
  } catch (err) {
    const dup = await duplicateError(err);
    if (dup) return dup;
    throw err;
  }
  revalidatePath(`/patients/${id}`);
  redirect(`/patients/${id}`);
}

export async function deletePatient(id: string) {
  await requireAdmin();
  if (!isValidObjectId(id)) return;
  await connectDB();
  await Visit.deleteMany({ patientId: id });
  await Patient.findByIdAndDelete(id);
  revalidatePath("/patients");
  redirect("/patients");
}
