import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

import { GENDERS } from "@/lib/constants";

const PatientSchema = new Schema(
  {
    patientNo: { type: Number, required: true, unique: true }, // short human-friendly ID (#1, #2, ...)
    name: { type: String, required: true, trim: true },
    // unique + sparse: uniqueness only applies to documents that actually have the field.
    cnic: { type: String, trim: true, unique: true, sparse: true, match: /^\d{5}-\d{7}-\d$/ },
    phone: { type: String, trim: true, unique: true, sparse: true, match: /^03\d{9}$/ },
    gender: { type: String, enum: GENDERS },
    age: { type: Number, min: 0, max: 130 },
    address: { type: String, trim: true },
  },
  { timestamps: true },
);

PatientSchema.index({ name: "text" });

PatientSchema.pre("validate", function () {
  if (!this.cnic && !this.phone) {
    this.invalidate("cnic", "Either CNIC or mobile number is required");
  }
});

export type PatientDoc = InferSchemaType<typeof PatientSchema>;

export const Patient: Model<PatientDoc> =
  (models.Patient as Model<PatientDoc>) || model<PatientDoc>("Patient", PatientSchema);
