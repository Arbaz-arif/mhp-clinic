import "server-only";
import { cache } from "react";
import { connectDB } from "@/lib/db";
import { Medicine } from "@/models/Medicine";
import { EXPIRY_WARNING_DAYS } from "@/lib/constants";
import { addDays, expiryLevel, startOfTodayUTC, type ExpiryLevel } from "@/lib/utils";

export type ExpiryAlert = {
  id: string; // batch _id
  medicineId: string;
  medicineName: string;
  form: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  daysLeft: number; // negative = already expired
  level: Exclude<ExpiryLevel, "ok">;
};

export type ExpiryReport = {
  generatedAt: string;
  expired: ExpiryAlert[]; // oldest expiry first
  expiring: ExpiryAlert[]; // within EXPIRY_WARNING_DAYS, soonest first
  counts: { expired: number; critical: number; warning: number; total: number };
};

/**
 * Expired batches + batches expiring within 90 days, via aggregation:
 *   $match (document pre-filter, uses the batches.expiryDate index)
 *   → $unwind batches → $match each batch → $dateDiff for days left.
 * Batches with quantity 0 are skipped (nothing left on the shelf to act on).
 *
 * Wrapped in React `cache` so the navbar bell and the dashboard share one query per request.
 */
export const getExpiryReport = cache(async (): Promise<ExpiryReport> => {
  await connectDB();
  const today = startOfTodayUTC(); // dates are stored as UTC midnight
  const cutoff = addDays(today, EXPIRY_WARNING_DAYS);

  const rows = await Medicine.aggregate<{
    _id: unknown;
    name: string;
    form: string;
    batch: { _id: unknown; batchNumber: string; expiryDate: Date; quantity: number };
    daysLeft: number;
  }>([
    { $match: { "batches.expiryDate": { $lte: cutoff } } },
    { $unwind: "$batches" },
    { $match: { "batches.expiryDate": { $lte: cutoff }, "batches.quantity": { $gt: 0 } } },
    {
      $addFields: {
        daysLeft: { $dateDiff: { startDate: today, endDate: "$batches.expiryDate", unit: "day" } },
      },
    },
    { $sort: { "batches.expiryDate": 1, name: 1 } },
    { $project: { name: 1, form: 1, batch: "$batches", daysLeft: 1 } },
  ]);

  const alerts: ExpiryAlert[] = rows.map((r) => ({
    id: String(r.batch._id),
    medicineId: String(r._id),
    medicineName: r.name,
    form: r.form,
    batchNumber: r.batch.batchNumber,
    expiryDate: new Date(r.batch.expiryDate).toISOString(),
    quantity: r.batch.quantity,
    daysLeft: r.daysLeft,
    level: expiryLevel(r.daysLeft) as ExpiryAlert["level"],
  }));

  const expired = alerts.filter((a) => a.level === "expired");
  const expiring = alerts.filter((a) => a.level !== "expired");
  return {
    generatedAt: new Date().toISOString(),
    expired,
    expiring,
    counts: {
      expired: expired.length,
      critical: expiring.filter((a) => a.level === "critical").length,
      warning: expiring.filter((a) => a.level === "warning").length,
      total: alerts.length,
    },
  };
});
