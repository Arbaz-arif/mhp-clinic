import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Admin } from "@/models/Admin";

export type Session = { adminId: string; email: string; name?: string };

/**
 * Current admin session, or null. Besides checking the JWT signature/expiry it confirms the
 * admin still exists and that the session was issued AFTER the last password change, so
 * changing the password signs out every other device. Cached per request (one DB read).
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const store = await cookies();
  const token = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!token) return null;

  await connectDB();
  const admin = await Admin.findById(token.adminId, { email: 1, name: 1, passwordChangedAt: 1 }).lean();
  if (!admin) return null;
  if (admin.passwordChangedAt && token.issuedAt * 1000 < admin.passwordChangedAt.getTime()) return null;

  return { adminId: String(admin._id), email: admin.email, name: admin.name ?? undefined };
});

/**
 * Defense in depth: every server action and the app layout call this, in addition to
 * the proxy check, so data is never served or changed without a valid session.
 * A signed-but-revoked cookie (e.g. after a password change) is cleared via /api/auth/signout,
 * because the proxy would otherwise bounce /login straight back here.
 */
export async function requireAdmin(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    const store = await cookies();
    redirect(store.get(SESSION_COOKIE) ? "/api/auth/signout?reason=expired" : "/login");
  }
  return session;
}
