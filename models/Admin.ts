import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AdminSchema = new Schema(
  {
    // Display name, e.g. "Dr. Akram Bhatti" (sidebar, dashboard greeting, printed prescriptions).
    name: { type: String, trim: true, maxlength: 100 },
    // The admin signs in with this email address (stored lowercase).
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, match: EMAIL_REGEX },
    passwordHash: { type: String, required: true },
    // Sessions issued before this moment are rejected (set when the password changes).
    passwordChangedAt: { type: Date },
  },
  { timestamps: true },
);

export type AdminDoc = InferSchemaType<typeof AdminSchema>;

export const Admin: Model<AdminDoc> = (models.Admin as Model<AdminDoc>) || model<AdminDoc>("Admin", AdminSchema);
