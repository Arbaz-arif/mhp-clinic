import "server-only";
import type { ExpiryAlert, ExpiryReport } from "@/lib/expiry";
import { formatDate } from "@/lib/utils";

const esc = (s: string | number) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const COLORS = { expired: "#dc2626", critical: "#f97316", warning: "#facc15" } as const;
const TEXT = { expired: "#ffffff", critical: "#ffffff", warning: "#422006" } as const;

function when(a: ExpiryAlert) {
  if (a.daysLeft < 0) return `expired ${-a.daysLeft}d ago`;
  if (a.daysLeft === 0) return "expires today";
  return `${a.daysLeft}d left`;
}

function section(title: string, alerts: ExpiryAlert[]) {
  if (!alerts.length) return "";
  const rows = alerts
    .map(
      (a) => `<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee"><b>${esc(a.medicineName)}</b><br><span style="color:#666;font-size:12px">${esc(a.form)}</span></td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">${esc(a.batchNumber)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;white-space:nowrap">${esc(formatDate(a.expiryDate))}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${esc(a.quantity)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee"><span style="background:${COLORS[a.level]};color:${TEXT[a.level]};padding:2px 6px;border-radius:4px;font-size:12px;white-space:nowrap">${esc(when(a))}</span></td>
      </tr>`,
    )
    .join("");
  return `<h3 style="margin:20px 0 6px">${esc(title)} (${alerts.length})</h3>
    <table style="border-collapse:collapse;width:100%;font-size:14px">
      <thead><tr style="text-align:left;color:#666;font-size:12px">
        <th style="padding:4px 8px">Medicine</th><th style="padding:4px 8px">Batch</th><th style="padding:4px 8px">Expiry</th>
        <th style="padding:4px 8px;text-align:right">Qty</th><th style="padding:4px 8px"></th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/** Subject, HTML and plain-text bodies for the daily expiry email. */
export function renderExpiryEmail(report: ExpiryReport, opts: { clinicName: string; appUrl?: string }) {
  const { counts } = report;
  const critical = report.expiring.filter((a) => a.level === "critical");
  const warning = report.expiring.filter((a) => a.level === "warning");

  const subject =
    `${opts.clinicName}: ${counts.expired} expired, ${counts.critical} expiring < 30 days` +
    (counts.warning ? `, ${counts.warning} < 90 days` : "");

  const link = opts.appUrl
    ? `<p style="margin-top:20px"><a href="${esc(opts.appUrl)}/alerts" style="color:#047857">Open expiry alerts in the app →</a></p>`
    : "";

  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:640px;margin:auto;color:#111">
    <h2 style="margin:0 0 4px">${esc(opts.clinicName)} · Medicine expiry report</h2>
    <p style="margin:0;color:#666">${esc(formatDate(report.generatedAt))} · in-stock batches only</p>
    ${section("Expired: do not dispense", report.expired)}
    ${section("Expiring in under 30 days", critical)}
    ${section("Expiring in 30 to 90 days", warning)}
    ${link}
  </div>`;

  const line = (a: ExpiryAlert) =>
    `- ${a.medicineName} (${a.form}) · batch ${a.batchNumber} · ${formatDate(a.expiryDate)} · qty ${a.quantity} · ${when(a)}`;
  const text = [
    `${opts.clinicName}: medicine expiry report (${formatDate(report.generatedAt)})`,
    report.expired.length ? `\nEXPIRED (${report.expired.length})\n${report.expired.map(line).join("\n")}` : "",
    critical.length ? `\nUNDER 30 DAYS (${critical.length})\n${critical.map(line).join("\n")}` : "",
    warning.length ? `\n30 TO 90 DAYS (${warning.length})\n${warning.map(line).join("\n")}` : "",
    opts.appUrl ? `\n${opts.appUrl}/alerts` : "",
  ].join("\n");

  return { subject, html, text };
}
