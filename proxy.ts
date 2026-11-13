import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// Route guard. In Next.js 16 the file formerly called `middleware.ts` is named `proxy.ts`
// and exports `proxy`; it runs before every matched request.
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Cron endpoints authenticate with "Authorization: Bearer CRON_SECRET" in the route itself
  // (Vercel Cron has no session cookie), so they skip the cookie check here.
  if (pathname.startsWith("/api/cron/")) return NextResponse.next();
  // Sign-out only clears the cookie; it must work even when the session is no longer valid.
  if (pathname === "/api/auth/signout") return NextResponse.next();

  const isLogin = pathname === "/login";
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);

  if (!session && !isLogin) {
    const url = new URL("/login", req.url);
    if (pathname !== "/") url.searchParams.set("from", pathname + search);
    const res = NextResponse.redirect(url);
    res.cookies.delete(SESSION_COOKIE); // clear an expired/invalid cookie
    return res;
  }
  if (session && isLogin) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  // Everything except Next's static assets and public files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};
