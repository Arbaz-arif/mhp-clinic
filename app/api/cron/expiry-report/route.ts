import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getExpiryReport } from "@/lib/expiry";
import { renderExpiryEmail } from "@/lib/expiry-email";
import { clinicInfo } from "@/lib/clinic";
import { todayPK } from "@/lib/utils";

/**
 * Daily expiry email, called by Vercel Cron (see vercel.json).
 *
 * Env:
 *   CRON_SECRET      required: Vercel sends it as "Authorization: Bearer <CRON_SECRET>"
 *   RESEND_API_KEY   required to send
 *   ALERT_EMAIL_TO   recipient(s), comma-separated
 *   ALERT_EMAIL_FROM sender on a domain verified in Resend, e.g. "MHP Clinic <alerts@yourclinic.pk>"
 *   APP_URL          optional, for the link in the email (defaults to the Vercel production URL)
 *
 * Manual test:  curl -H "Authorization: Bearer $CRON_SECRET" https://<app>/api/cron/expiry-report
 * Add ?force=1 to send even when nothing is expiring.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report = await getExpiryReport();
  const force = req.nextUrl.searchParams.get("force") === "1";
  if (report.counts.total === 0 && !force) {
    return NextResponse.json({ sent: false, reason: "Nothing expired or expiring within 90 days", counts: report.counts });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = (process.env.ALERT_EMAIL_TO ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const from = process.env.ALERT_EMAIL_FROM || "MHP Clinic <onboarding@resend.dev>";
  if (!apiKey || to.length === 0) {
    return NextResponse.json({ error: "RESEND_API_KEY and ALERT_EMAIL_TO must be set", counts: report.counts }, { status: 500 });
  }

  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const appUrl = process.env.APP_URL || (productionHost ? `https://${productionHost}` : undefined);
  const { subject, html, text } = renderExpiryEmail(report, { clinicName: clinicInfo().name, appUrl });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // One email per day even if the cron is retried.
      "Idempotency-Key": `expiry-report-${todayPK()}${force ? `-${Date.now()}` : ""}`,
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("Resend error", res.status, detail);
    return NextResponse.json({ sent: false, error: "Email provider rejected the request", status: res.status, detail }, { status: 502 });
  }

  const { id } = (await res.json()) as { id?: string };
  return NextResponse.json({ sent: true, id, counts: report.counts });
}
