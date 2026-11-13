import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const PrescriptionItemSchema = new Schema(
  {
    medicineId: { type: Schema.Types.ObjectId, ref: "Medicine" }, // set when picked from inventory
    medicineName: { type: String, required: true, trim: true }, // kept even if the medicine is deleted later
    potency: { type: String, required: true, trim: true }, // e.g. 30C, 200C, 1M, Q
    dose: { type: String, required: true, trim: true }, // e.g. 4 pills, 5 drops
    frequency: { type: String, required: true, trim: true }, // e.g. TDS
    duration: { type: String, required: true, trim: true }, // e.g. 7 days
    instructions: { type: String, trim: true },
  },
  { _id: false },
);

const PrescriptionSchema = new Schema(
  {
    items: { type: [PrescriptionItemSchema], default: [] },
    generalInstructions: { type: String, trim: true },
  },
  { _id: false },
);

const VisitSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    visitDate: { type: Date, required: true, index: true },
    complaints: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    followUpDate: { type: Date },
    prescription: { type: PrescriptionSchema, default: () => ({ items: [] }) },
  },
  { timestamps: true },
);

// Serves "last N visits of a patient" directly.
VisitSchema.index({ patientId: 1, visitDate: -1, createdAt: -1 });

export type VisitDoc = InferSchemaType<typeof VisitSchema>;

export const Visit: Model<VisitDoc> = (models.Visit as Model<VisitDoc>) || model<VisitDoc>("Visit", VisitSchema);
