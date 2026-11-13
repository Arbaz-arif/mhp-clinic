import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { EXPIRY_CRITICAL_DAYS, EXPIRY_WARNING_DAYS } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Dates are stored as UTC midnight ("date-only"), so always format in UTC. */
export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** YYYY-MM-DD for <input type="date">. */
export function toDateInput(d: Date | string | null | undefined) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

/** Today's date in Pakistan as YYYY-MM-DD. */
export function todayPK() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
}

/** UTC midnight of today (Pakistan calendar day). */
export function startOfTodayUTC() {
  return new Date(todayPK() + "T00:00:00.000Z");
}

export function addDays(d: Date, days: number) {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + days);
  return r;
}

/** Page `searchParams` values can be repeated (`?q=a&q=b` → ["a","b"]). Take the first, as a string. */
export type SearchParamValue = string | string[] | undefined;
export function param(v: SearchParamValue): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** expired (red) · critical: < 30 days (orange) · warning: ≤ 90 days (yellow) · ok */
export type ExpiryLevel = "expired" | "critical" | "warning" | "ok";

export function expiryLevel(daysLeft: number): ExpiryLevel {
  if (daysLeft < 0) return "expired";
  if (daysLeft < EXPIRY_CRITICAL_DAYS) return "critical";
  if (daysLeft <= EXPIRY_WARNING_DAYS) return "warning";
  return "ok";
}

/** Whole days from today (Pakistan calendar day) to the expiry date; negative once expired. */
export function daysUntil(date: Date | string) {
  return Math.round((new Date(date).getTime() - startOfTodayUTC().getTime()) / 86_400_000);
}

export function expiryStatus(expiry: Date | string): { status: ExpiryLevel; daysLeft: number } {
  const daysLeft = daysUntil(expiry);
  return { status: expiryLevel(daysLeft), daysLeft };
}
