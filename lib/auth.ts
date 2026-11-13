import { SignJWT, jwtVerify } from "jose";

// Session = HS256-signed JWT in an HTTP-only cookie. jose uses Web Crypto, so this
// file works in the proxy (route guard) as well as in server actions.
export const SESSION_COOKIE = "mhp_session";
export const SESSION_MAX_AGE = 60 * 60 * 12; // 12 hours, in seconds

const ISSUER = "mhp-clinic";
const AUDIENCE = "mhp-clinic-admin";

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must be set (at least 32 characters)");
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(adminId: string, email: string) {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(adminId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

/** Returns the session (admin id + email) if the JWT is valid and unexpired, otherwise null. */
export async function verifySessionToken(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"],
    });
    if (!payload.sub) return null;
    return { adminId: payload.sub, email: String(payload.email ?? ""), issuedAt: payload.iat ?? 0 };
  } catch {
    return null; // bad signature, expired, malformed...
  }
}

export const sessionCookieOptions = {
  httpOnly: true, // not readable from JavaScript
  secure: process.env.NODE_ENV === "production", // HTTPS only on Vercel
  sameSite: "lax" as const, // not sent on cross-site POSTs (CSRF protection)
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

/**
 * Only allow redirects back to a path on this site (prevents open redirects via ?from=).
 * Resolves the value the way a browser would, because URL parsing treats "\" like "/"
 * and strips tabs/newlines: "/\evil.com" and "/\t/evil.com" both mean "//evil.com".
 */
export function safeRedirectPath(from: unknown) {
  if (typeof from !== "string" || !from.startsWith("/")) return "/";
  const base = "http://same-site.invalid";
  try {
    const url = new URL(from, base);
    if (url.origin !== base) return "/";
    if (url.pathname.startsWith("/api/")) return "/"; // never land on an API route (e.g. sign-out) after login
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
}
