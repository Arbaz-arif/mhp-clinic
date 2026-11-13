/** Minimal RFC 4180 CSV writer for exports. */

type Cell = string | number | Date | null | undefined;

function cell(v: Cell): string {
  if (v == null) return "";
  let s = v instanceof Date ? v.toISOString().slice(0, 10) : String(v);
  // Formula injection: Excel/Sheets run cells starting with these as formulas.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  // Quote when needed; double any quotes inside.
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Build a CSV string. Starts with a UTF-8 BOM so Excel shows non-English text
 * (e.g. Urdu names) correctly, and uses CRLF line endings.
 */
export function toCsv(header: string[], rows: Cell[][]): string {
  return "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}
