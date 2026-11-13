import "server-only";
import { connectDB } from "@/lib/db";
import { Medicine } from "@/models/Medicine";

/** Batch writes on the embedded `batches` array. Server actions add auth + validation on top. */

export type BatchInput = { batchNumber: string; expiryDate: Date; quantity: number; purchaseDate?: Date };
export type BatchWriteResult = "ok" | "duplicate" | "not-found";

/** $push a new batch. The filter makes a duplicate batch number fail atomically. */
export async function pushBatch(medicineId: string, batch: BatchInput): Promise<BatchWriteResult> {
  await connectDB();
  const res = await Medicine.updateOne(
    { _id: medicineId, "batches.batchNumber": { $ne: batch.batchNumber } },
    { $push: { batches: batch } },
    { runValidators: true },
  );
  if (res.matchedCount === 1) return "ok";
  return (await Medicine.exists({ _id: medicineId })) ? "duplicate" : "not-found";
}

/** Update one batch in place with the positional operator (batches.$.field). */
export async function setBatch(medicineId: string, batchId: string, batch: BatchInput): Promise<BatchWriteResult> {
  await connectDB();
  // Is another batch of this medicine already using that number?
  const clash = await Medicine.exists({
    _id: medicineId,
    batches: { $elemMatch: { batchNumber: batch.batchNumber, _id: { $ne: batchId } } },
  });
  if (clash) return "duplicate";

  const $set: Record<string, unknown> = {
    "batches.$.batchNumber": batch.batchNumber,
    "batches.$.expiryDate": batch.expiryDate,
    "batches.$.quantity": batch.quantity,
  };
  const update = batch.purchaseDate
    ? { $set: { ...$set, "batches.$.purchaseDate": batch.purchaseDate } }
    : { $set, $unset: { "batches.$.purchaseDate": 1 } };

  // "batches._id" in the filter is the array element that `$` points at.
  const res = await Medicine.updateOne({ _id: medicineId, "batches._id": batchId }, update, { runValidators: true });
  return res.matchedCount === 1 ? "ok" : "not-found";
}

/** $pull one batch out of the array. */
export async function pullBatch(medicineId: string, batchId: string): Promise<BatchWriteResult> {
  await connectDB();
  // Match on the batch too and check matchedCount: with timestamps on, Mongoose adds
  // $set updatedAt, so modifiedCount would be 1 even if nothing was pulled.
  const res = await Medicine.updateOne(
    { _id: medicineId, "batches._id": batchId },
    { $pull: { batches: { _id: batchId } } },
  );
  return res.matchedCount === 1 ? "ok" : "not-found";
}
