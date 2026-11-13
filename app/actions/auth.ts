"use server";

import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { SESSION_COOKIE, createSessionToken, safeRedirectPath, sessionCookieOptions } from "@/lib/auth";
import { Admin } from "@/models/Admin";
import { LOGIN_MAX_FAILURES, LOGIN_WINDOW_MINUTES, LoginAttempt } from "@/models/LoginAttempt";

// Compared against when the email isn't registered, so response time doesn't reveal valid emails.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= bcrypt.hash("not-a-real-password", 12));

/** Client IP. On Vercel, x-forwarded-for is set by the platform (first entry = the client). */
async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim().slice(0, 64);
}

export async function login(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 254);
  const password = String(formData.get("password") ?? "").slice(0, 200); // bcrypt only uses 72 bytes anyway
  if (!email || !password) return { error: "Enter your email and password" };

  await connectDB();

  // Brute-force protection: too many recent failures from this IP → refuse without checking the password.
  const ip = await clientIp();
  const since = new Date(Date.now() - LOGIN_WINDOW_MINUTES * 60_000);
  const failures = await LoginAttempt.countDocuments({ ip, createdAt: { $gte: since } });
  if (failures >= LOGIN_MAX_FAILURES) {
    return { error: `Too many failed attempts. Please wait ${LOGIN_WINDOW_MINUTES} minutes and try again.` };
  }

  const admin = await Admin.findOne({ email }).lean();
  const ok = await bcrypt.compare(password, admin?.passwordHash ?? (await getDummyHash()));
  if (!admin || !ok) {
    await LoginAttempt.create({ ip });
    await new Promise((r) => setTimeout(r, 500)); // slow down guessing
    const left = LOGIN_MAX_FAILURES - failures - 1;
    if (left <= 0) {
      return { error: `Too many failed attempts. Please wait ${LOGIN_WINDOW_MINUTES} minutes and try again.` };
    }
    return {
      error: left <= 3 ? `Incorrect email or password. ${left} attempt(s) left.` : "Incorrect email or password",
    };
  }

  await LoginAttempt.deleteMany({ ip }); // successful sign-in clears this IP's failures

  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(String(admin._id), admin.email), sessionCookieOptions);
  redirect(safeRedirectPath(formData.get("from")));
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
