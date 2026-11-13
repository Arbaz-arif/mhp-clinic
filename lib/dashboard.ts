import "server-only";
import { connectDB } from "@/lib/db";
import { addDays, startOfTodayUTC, todayPK } from "@/lib/utils";
import { Patient } from "@/models/Patient";
import { Visit } from "@/models/Visit";

export const CHART_DAYS = 14;
const FOLLOW_UP_AHEAD_DAYS = 7;
const OVERDUE_LOOKBACK_DAYS = 30;

export type DailyVisits = { date: string; count: number }[];

export type FollowUp = {
  patientId: string;
  patientName: string;
  patientNo: number;
  phone?: string;
  followUpDate: string;
  daysFromToday: number; // negative = overdue, 0 = today
  lastVisitId: string;
  lastComplaints: string;
};

export type DashboardData = {
  visitsToday: number;
  visitsYesterday: number;
  totalPatients: number;
  newPatientsThisMonth: number;
  daily: DailyVisits; // oldest → newest, CHART_DAYS entries, today last
  followUps: FollowUp[]; // overdue first, then today, then upcoming
  followUpCounts: { overdue: number; today: number; upcoming: number };
};

/** Everything the dashboard needs except expiry (that comes from getExpiryReport). */
export async function getDashboardData(): Promise<DashboardData> {
  await connectDB();
  const today = startOfTodayUTC(); // visit dates are stored as UTC midnight of the PK day
  const yesterday = addDays(today, -1);
  const chartStart = addDays(today, -(CHART_DAYS - 1));
  // Patients' createdAt is a real timestamp, so use midnight in Pakistan (UTC+5) for "this month".
  const monthStart = new Date(`${todayPK().slice(0, 7)}-01T00:00:00+05:00`);

  const [visitsToday, visitsYesterday, totalPatients, newPatientsThisMonth, perDay, followUps] = await Promise.all([
    Visit.countDocuments({ visitDate: today }),
    Visit.countDocuments({ visitDate: yesterday }),
    Patient.estimatedDocumentCount(),
    Patient.countDocuments({ createdAt: { $gte: monthStart } }),
    Visit.aggregate<{ _id: Date; count: number }>([
      { $match: { visitDate: { $gte: chartStart, $lte: today } } },
      { $group: { _id: "$visitDate", count: { $sum: 1 } } },
    ]),
    getFollowUps({ overdueDays: OVERDUE_LOOKBACK_DAYS, aheadDays: FOLLOW_UP_AHEAD_DAYS }),
  ]);

  // Fill missing days with 0 so the chart always has CHART_DAYS bars.
  const counts = new Map(perDay.map((d) => [new Date(d._id).toISOString().slice(0, 10), d.count]));
  const daily: DailyVisits = Array.from({ length: CHART_DAYS }, (_, i) => {
    const date = addDays(chartStart, i).toISOString().slice(0, 10);
    return { date, count: counts.get(date) ?? 0 };
  });

  return {
    visitsToday,
    visitsYesterday,
    totalPatients,
    newPatientsThisMonth,
    daily,
    followUps,
    followUpCounts: {
      overdue: followUps.filter((f) => f.daysFromToday < 0).length,
      today: followUps.filter((f) => f.daysFromToday === 0).length,
      upcoming: followUps.filter((f) => f.daysFromToday > 0).length,
    },
  };
}

/**
 * Patients whose LATEST visit set a follow-up date (if they came back since, it's done),
 * from `overdueDays` ago to `aheadDays` ahead, soonest first.
 */
export async function getFollowUps({ overdueDays, aheadDays }: { overdueDays: number; aheadDays: number }): Promise<FollowUp[]> {
  await connectDB();
  const today = startOfTodayUTC();
  const rows = await Visit.aggregate<{
    _id: unknown;
    visitId: unknown;
    followUpDate: Date;
    complaints: string;
    patient?: { name: string; patientNo: number; phone?: string };
  }>([
    { $sort: { patientId: 1, visitDate: -1, createdAt: -1 } },
    {
      $group: {
        _id: "$patientId",
        visitId: { $first: "$_id" },
        followUpDate: { $first: "$followUpDate" },
        complaints: { $first: "$complaints" },
      },
    },
    { $match: { followUpDate: { $gte: addDays(today, -overdueDays), $lte: addDays(today, aheadDays) } } },
    { $sort: { followUpDate: 1 } },
    { $lookup: { from: "patients", localField: "_id", foreignField: "_id", as: "patient" } },
    { $set: { patient: { $first: "$patient" } } },
    { $match: { patient: { $ne: null } } },
  ]);

  return rows.map((r) => ({
    patientId: String(r._id),
    patientName: r.patient!.name,
    patientNo: r.patient!.patientNo,
    phone: r.patient!.phone,
    followUpDate: new Date(r.followUpDate).toISOString(),
    daysFromToday: Math.round((new Date(r.followUpDate).getTime() - today.getTime()) / 86_400_000),
    lastVisitId: String(r.visitId),
    lastComplaints: r.complaints,
  }));
}
