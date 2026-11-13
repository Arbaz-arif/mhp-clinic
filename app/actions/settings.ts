"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/auth";
import { requireAdmin } from "@/lib/session";
import { emailSchema, passwordSchema, profileSchema, zodErrors, type FormState } from "@/lib/validation";
import { Admin } from "@/models/Admin";

const WRONG_PASSWORD: FormState = { ok: false, errors: { currentPassword: ["Current password is incorrect"] } };

/** Check the signed-in admin's current password (with a small delay on failure to slow guessing). */
async function verifyCurrentPassword(adminId: string, password: string) {
  const admin = await Admin.findById(adminId, { passwordHash: 1 }).lean();
  const ok = !!admin && (await bcrypt.compare(password, admin.passwordHash));
  if (!ok) await new Promise((r) => setTimeout(r, 500));
  return ok;
}

/** Display name (no password needed: it only changes how the app greets you). */
export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireAdmin();
  const parsed = profileSchema.safeParse({ name: formData.get("name") ?? "" });
  if (!parsed.success) return zodErrors(parsed.error);

  await connectDB();
  await Admin.updateOne(
    { _id: session.adminId },
    parsed.data.name ? { $set: { name: parsed.data.name } } : { $unset: { name: 1 } },
  );
  revalidatePath("/", "layout");
  return { ok: true, message: "Name saved." };
}

/** Sign-in email. Requires the current password. */
export async function updateEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireAdmin();
  const parsed = emailSchema.safeParse({
    email: formData.get("email") ?? "",
    currentPassword: formData.get("currentPassword") ?? "",
  });
  if (!parsed.success) return zodErrors(parsed.error);
  const { email, currentPassword } = parsed.data;

  if (email === session.email) return { ok: false, errors: { email: ["That's already your email"] } };

  await connectDB();
  if (!(await verifyCurrentPassword(session.adminId, currentPassword))) return WRONG_PASSWORD;

  try {
    await Admin.updateOne({ _id: session.adminId }, { $set: { email } }, { runValidators: true });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) return { ok: false, errors: { email: ["That email is already in use"] } };
    throw err;
  }

  // The session cookie carries the email: re-issue it so this browser stays signed in.
  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(session.adminId, email), sessionCookieOptions);
  revalidatePath("/", "layout");
  return { ok: true, message: `Email changed. Sign in with ${email} from now on.` };
}

/** Password. Requires the current one; signs out every other device. */
export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireAdmin();
  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword") ?? "",
    newPassword: formData.get("newPassword") ?? "",
    confirmPassword: formData.get("confirmPassword") ?? "",
  });
  if (!parsed.success) return zodErrors(parsed.error);

  await connectDB();
  if (!(await verifyCurrentPassword(session.adminId, parsed.data.currentPassword))) return WRONG_PASSWORD;

  // Whole seconds, because JWT "issued at" is in seconds: this browser's new token (issued now)
  // stays valid, every token issued before this moment is rejected by getSession().
  const changedAt = new Date(Math.floor(Date.now() / 1000) * 1000);
  await Admin.updateOne(
    { _id: session.adminId },
    { $set: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12), passwordChangedAt: changedAt } },
  );

  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(session.adminId, session.email), sessionCookieOptions);
  return { ok: true, message: "Password changed. Other devices have been signed out." };
}
