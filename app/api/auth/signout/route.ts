import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

/**
 * Clears the session cookie and goes to /login. Used when a cookie is still validly signed but
 * no longer accepted (password changed on another device, admin removed): the proxy can't tell,
 * so without clearing it /login would bounce back to the app forever.
 */
export function GET(req: NextRequest) {
  const url = new URL("/login", req.url);
  if (req.nextUrl.searchParams.get("reason") === "expired") url.searchParams.set("reason", "expired");
  const res = NextResponse.redirect(url);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
