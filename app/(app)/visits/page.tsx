import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RecentVisits } from "@/components/recent-visits";
import { getVisitsOn } from "@/lib/queries";
import { addDays, param, startOfTodayUTC, type SearchParamValue } from "@/lib/utils";

export const metadata = { title: "Visits · MHP Clinic" };

/** "YYYY-MM-DD" → Date at UTC midnight, or null if it isn't a real calendar date. */
function parseDay(v: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(v + "T00:00:00.000Z");
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v ? null : d;
}
const iso = (d: Date) => d.toISOString().slice(0, 10);

/** All visits on one day (defaults to today), with previous/next day navigation. */
export default async function VisitsByDayPage({ searchParams }: { searchParams: Promise<{ date?: SearchParamValue }> }) {
  const today = startOfTodayUTC();
  const day = parseDay(param((await searchParams).date)) ?? today;
  const isToday = iso(day) === iso(today);
  const isFuture = day > today;
  const visits = await getVisitsOn(day);

  const title = day.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const dayHref = (d: Date) => (iso(d) === iso(today) ? "/visits" : `/visits?date=${iso(d)}`);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <CalendarDays className="text-muted-foreground size-5" aria-hidden />
          {isToday ? "Today's visits" : "Visits"}
        </CardTitle>
        <CardDescription>
          {title} · {visits.length} visit{visits.length === 1 ? "" : "s"}
        </CardDescription>
        <CardAction className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="icon" aria-label="Previous day">
            <Link href={dayHref(addDays(day, -1))}>
              <ChevronLeft />
            </Link>
          </Button>
          {!isToday && (
            <Button asChild variant="outline" size="sm" className="h-9">
              <Link href="/visits">Today</Link>
            </Button>
          )}
          <Button asChild={!isToday && !isFuture} variant="outline" size="icon" aria-label="Next day" disabled={isToday || isFuture}>
            {isToday || isFuture ? (
              <span>
                <ChevronRight />
              </span>
            ) : (
              <Link href={dayHref(addDays(day, 1))}>
                <ChevronRight />
              </Link>
            )}
          </Button>
          {/* Jump to any date (plain GET form, works without JavaScript) */}
          <form action="/visits" className="flex items-center gap-2">
            <Input type="date" name="date" defaultValue={iso(day)} max={iso(today)} aria-label="Go to date" className="h-9 w-auto" />
            <Button type="submit" variant="secondary" size="sm" className="h-9">
              Go
            </Button>
          </form>
        </CardAction>
      </CardHeader>
      <CardContent>
        {visits.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">No visits recorded on this day.</p>
        ) : (
          <RecentVisits visits={visits} />
        )}
      </CardContent>
    </Card>
  );
}
