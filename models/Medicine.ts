import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

import { MEDICINE_FORMS } from "@/lib/constants";

const BatchSchema = new Schema({
  batchNumber: { type: String, required: true, trim: true },
  expiryDate: { type: Date, required: true },
  quantity: { type: Number, required: true, min: 0, default: 0 },
  purchaseDate: { type: Date },
});

const MedicineSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    form: { type: String, enum: MEDICINE_FORMS, required: true },
    manufacturer: { type: String, trim: true },
    batches: { type: [BatchSchema], default: [] },
  },
  { timestamps: true },
);

MedicineSchema.index({ "batches.expiryDate": 1 });

export type MedicineDoc = InferSchemaType<typeof MedicineSchema>;

export const Medicine: Model<MedicineDoc> =
  (models.Medicine as Model<MedicineDoc>) || model<MedicineDoc>("Medicine", MedicineSchema);
