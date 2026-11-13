import { Schema, model, models, type Model } from "mongoose";

interface ICounter {
  _id: string;
  seq: number;
}

const CounterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const Counter: Model<ICounter> =
  (models.Counter as Model<ICounter>) || model<ICounter>("Counter", CounterSchema);

/** Atomically get the next number in a sequence (e.g. patient IDs 1, 2, 3...). */
export async function nextSequence(name: string) {
  const doc = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  ).lean();
  return doc!.seq;
}
