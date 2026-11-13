import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

export const LOGIN_WINDOW_MINUTES = 15;
export const LOGIN_MAX_FAILURES = 10;

/**
 * One document per failed login, keyed by client IP. MongoDB's TTL index deletes
 * each one automatically after the window, so the lockout clears itself.
 */
const LoginAttemptSchema = new Schema({
  ip: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now, expires: LOGIN_WINDOW_MINUTES * 60 },
});

export type LoginAttemptDoc = InferSchemaType<typeof LoginAttemptSchema>;

export const LoginAttempt: Model<LoginAttemptDoc> =
  (models.LoginAttempt as Model<LoginAttemptDoc>) || model<LoginAttemptDoc>("LoginAttempt", LoginAttemptSchema);
