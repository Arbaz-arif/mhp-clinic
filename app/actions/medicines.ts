"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { Medicine } from "@/models/Medicine";
import { pullBatch, pushBatch, setBatch } from "@/lib/batches";
import { batchSchema, medicineSchema, zodErrors, type FormState } from "@/lib/validation";

const OBJECT_ID = /^[a-f\d]{24}$/i;

/** Inventory feeds the nav alert badge, dashboard and alerts page, so refresh everything. */
const refreshInventory = () => revalidatePath("/", "layout");

// ---------------------------------------------------------------------------
// Medicine: name, form, manufacturer
// ---------------------------------------------------------------------------

function readMedicine(formData: FormData) {
  return medicineSchema.safeParse({
    name: formData.get("name") ?? "",
    form: formData.get("form") ?? "",
    manufacturer: formData.get("manufacturer") ?? "",
  });
}

export async function createMedicine(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = readMedicine(formData);
  if (!parsed.success) return zodErrors(parsed.error);

  await connectDB();
  const med = await Medicine.create({ ...parsed.data, batches: [] });
  refreshInventory();
  redirect(`/medicines/${med._id}`); // straight to the page where batches are added
}

export async function updateMedicine(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  if (!OBJECT_ID.test(id)) return { ok: false, message: "Invalid medicine" };
  const parsed = readMedicine(formData);
  if (!parsed.success) return zodErrors(parsed.error);

  await connectDB();
  const { name, form, manufacturer } = parsed.data;
  const res = await Medicine.updateOne(
    { _id: id },
    manufacturer
      ? { $set: { name, form, manufacturer } }
      : { $set: { name, form }, $unset: { manufacturer: 1 } },
    { runValidators: true },
  );
  if (res.matchedCount === 0) return { ok: false, message: "Medicine not found" };

  refreshInventory();
  redirect(`/medicines/${id}`);
}

export async function deleteMedicine(id: string) {
  await requireAdmin();
  if (!OBJECT_ID.test(id)) return;
  await connectDB();
  await Medicine.deleteOne({ _id: id });
  refreshInventory();
  redirect("/medicines");
}

// ---------------------------------------------------------------------------
// Batches (embedded array): $push / positional $set / $pull
// ---------------------------------------------------------------------------

function readBatch(formData: FormData) {
  return batchSchema.safeParse({
    batchNumber: formData.get("batchNumber") ?? "",
    expiryDate: formData.get("expiryDate") ?? "",
    quantity: formData.get("quantity") ?? "",
    purchaseDate: formData.get("purchaseDate") ?? "",
  });
}

const DUPLICATE_BATCH: FormState = {
  ok: false,
  errors: { batchNumber: ["This batch number already exists for this medicine"] },
};

/** Add a batch ($push, see lib/batches.ts). */
export async function addBatch(medicineId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  if (!OBJECT_ID.test(medicineId)) return { ok: false, message: "Invalid medicine" };
  const parsed = readBatch(formData);
  if (!parsed.success) return zodErrors(parsed.error);

  const result = await pushBatch(medicineId, parsed.data);
  if (result === "duplicate") return DUPLICATE_BATCH;
  if (result === "not-found") return { ok: false, message: "Medicine not found" };
  refreshInventory();
  return { ok: true };
}

/** Edit one batch in place (positional $set, see lib/batches.ts). */
export async function updateBatch(
  medicineId: string,
  batchId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  if (!OBJECT_ID.test(medicineId) || !OBJECT_ID.test(batchId)) return { ok: false, message: "Invalid batch" };
  const parsed = readBatch(formData);
  if (!parsed.success) return zodErrors(parsed.error);

  const result = await setBatch(medicineId, batchId, parsed.data);
  if (result === "duplicate") return DUPLICATE_BATCH;
  if (result === "not-found") return { ok: false, message: "Batch not found (it may have been deleted)" };
  refreshInventory();
  return { ok: true };
}

/** Remove one batch ($pull, see lib/batches.ts). */
export async function deleteBatch(medicineId: string, batchId: string) {
  await requireAdmin();
  if (!OBJECT_ID.test(medicineId) || !OBJECT_ID.test(batchId)) return;
  await pullBatch(medicineId, batchId);
  refreshInventory();
}
