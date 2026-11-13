import Link from "next/link";
import { Suspense } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarCheck,
  CalendarClock,
  History,
  PackagePlus,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpiryAlertList, ExpiryCounts } from "@/components/expiry-alert-list";
import { RecentVisits } from "@/components/recent-visits";
import { SearchBar } from "@/components/search-bar";
import { FollowUpList } from "@/components/dashboard/follow-up-list";
import { StatTile } from "@/components/dashboard/stat-tile";
import { VisitsChart } from "@/components/dashboard/visits-chart";
import { CHART_DAYS, getDashboardData } from "@/lib/dashboard";
import { getExpiryReport } from "@/lib/expiry";
import { getRecentVisits } from "@/lib/queries";
import { getSession } from "@/lib/session";

export const metadata = { title: "Dashboard · MHP Clinic" };

function greeting() {
  const hour = Number(new Date().toLocaleString("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Karachi" }));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export default async function DashboardPage() {
  const [data, recent, report, session] = await Promise.all([
    getDashboardData(),
    getRecentVisits(6),
    getExpiryReport(), // shared with the sidebar bell via React cache()
    getSession(), // also cached: same lookup as the layout
  ]);

  const urgentStock = [...report.expired, ...report.expiring].slice(0, 5);
  const delta = data.visitsToday - data.visitsYesterday;
  const chartTotal = data.daily.reduce((s, d) => s + d.count, 0);
  const todayLong = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Karachi",
  });

  return (
    <div className="grid gap-5 sm:gap-6">
      {/* Header */}
      <header className="grid gap-4">
        <div>
          <p className="text-muted-foreground text-sm">{todayLong}</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{greeting()}, {session?.name || "Doctor"}</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Here&apos;s your clinic at a glance.</p>
        </div>

        {/* Action row: the app's search + quick actions (phones: search on its own line) */}
        <div className="grid gap-2 sm:flex sm:items-center">
          <Suspense fallback={<div className="h-10 flex-1" />}>
            <SearchBar size="lg" className="sm:flex-1" />
          </Suspense>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
            <Button asChild variant="outline" className="h-10">
              <Link href="/medicines/new">
                <PackagePlus /> Add medicine
              </Link>
            </Button>
            <Button asChild className="h-10">
              <Link href="/patients/new">
                <UserPlus /> New patient
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-label="Key figures">
        <StatTile
          label="Visits today"
          href="/visits"
          value={data.visitsToday}
          icon={CalendarCheck}
          tone="emerald"
          footnote={
            delta === 0 ? (
              <>Same as yesterday ({data.visitsYesterday})</>
            ) : (
              <span className="inline-flex items-center gap-1">
                {delta > 0 ? (
                  <ArrowUpRight className="size-3.5 text-emerald-700" aria-hidden />
                ) : (
                  <ArrowDownRight className="size-3.5" aria-hidden />
                )}
                <span className={delta > 0 ? "font-medium text-emerald-700" : undefined}>
                  {delta > 0 ? `+${delta}` : delta}
                </span>
                vs yesterday ({data.visitsYesterday})
              </span>
            )
          }
        />
        <StatTile
          label="Total patients"
          value={data.totalPatients.toLocaleString("en-US")}
          icon={Users}
          tone="sky"
          href="/patients"
          footnote={
            data.newPatientsThisMonth > 0 ? (
              <>
                <span className="font-medium text-sky-700">+{data.newPatientsThisMonth}</span> new this month
              </>
            ) : (
              "No new patients this month"
            )
          }
        />
        <StatTile
          label="Follow-ups due"
          href="/follow-ups"
          value={data.followUpCounts.today}
          icon={CalendarClock}
          tone={data.followUpCounts.overdue > 0 ? "orange" : "neutral"}
          footnote={
            data.followUpCounts.overdue > 0 ? (
              <span className="font-medium text-orange-700">{data.followUpCounts.overdue} overdue</span>
            ) : (
              `${data.followUpCounts.upcoming} in the next 7 days`
            )
          }
        />
        <StatTile
          label="Expiry alerts"
          value={report.counts.total}
          icon={AlertTriangle}
          tone={report.counts.expired > 0 ? "red" : report.counts.total > 0 ? "orange" : "neutral"}
          href="/alerts"
          footnote={
            report.counts.total === 0 ? (
              "All stock in date"
            ) : (
              <>
                {report.counts.expired > 0 && <span className="font-medium text-red-700">{report.counts.expired} expired · </span>}
                {report.counts.critical + report.counts.warning} within 90 days
              </>
            )
          }
        />
      </section>

      {/* Activity + follow-ups */}
      <section className="grid gap-5 sm:gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="text-muted-foreground size-4" aria-hidden /> Visits, last {CHART_DAYS} days
            </CardTitle>
            <CardDescription>
              <span className="text-foreground font-semibold tabular-nums">{chartTotal}</span> visits · average{" "}
              <span className="tabular-nums">{(chartTotal / CHART_DAYS).toFixed(1)}</span> a day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VisitsChart daily={data.daily} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="text-muted-foreground size-4" aria-hidden /> Follow-ups
            </CardTitle>
            <CardDescription>Overdue, today and the next 7 days</CardDescription>
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link href="/follow-ups">
                  View all <ArrowRight />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <FollowUpList items={data.followUps} />
          </CardContent>
        </Card>
      </section>

      {/* Recent visits + stock */}
      <section className="grid gap-5 sm:gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="text-muted-foreground size-4" aria-hidden /> Recent visits
            </CardTitle>
            <CardDescription>Latest across all patients</CardDescription>
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link href="/patients">
                  All patients <ArrowRight />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <RecentVisits visits={recent} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="text-muted-foreground size-4" aria-hidden /> Medicine stock
            </CardTitle>
            <CardDescription>In-stock batches expiring within 90 days</CardDescription>
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link href="/alerts">
                  View all <ArrowRight />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          {/* grid-cols-1 = minmax(0,1fr): lets long names truncate instead of widening the card */}
          <CardContent className="grid grid-cols-1 gap-3">
            <ExpiryCounts counts={report.counts} />
            <ExpiryAlertList alerts={urgentStock} className="-mx-2" emptyText="All stock is in date." />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
