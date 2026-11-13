import { CalendarClock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FollowUpList } from "@/components/dashboard/follow-up-list";
import { getFollowUps } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

export const metadata = { title: "Follow-ups · MHP Clinic" };

const OVERDUE_DAYS = 90;
const AHEAD_DAYS = 30;

/** Everyone who should come back: overdue (last 90 days), today, and the next 30 days. */
export default async function FollowUpsPage() {
  const all = await getFollowUps({ overdueDays: OVERDUE_DAYS, aheadDays: AHEAD_DAYS });
  const overdue = all.filter((f) => f.daysFromToday < 0);
  const today = all.filter((f) => f.daysFromToday === 0);
  const upcoming = all.filter((f) => f.daysFromToday > 0);

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold sm:text-2xl">
          <CalendarClock className="text-muted-foreground size-5" aria-hidden /> Follow-ups
        </h1>
        <p className="text-muted-foreground text-sm">
          Patients whose latest visit set a follow-up date. Once they visit again, they drop off this list.
        </p>
      </div>

      {/* One row of three columns from tablet width up; stacked on phones */}
      <div className="grid gap-4 md:grid-cols-3">
        <Section title="Due today" count={today.length} description="Expected in clinic today." items={today} empty="No follow-ups due today." />
        <Section
          title="Overdue"
          count={overdue.length}
          description={`Missed their date (last ${OVERDUE_DAYS} days). Consider calling.`}
          items={overdue}
          empty="Nobody is overdue."
          className={overdue.length ? "border-red-200" : undefined}
        />
        <Section
          title="Upcoming"
          count={upcoming.length}
          description={`Next ${AHEAD_DAYS} days.`}
          items={upcoming}
          empty={`Nothing in the next ${AHEAD_DAYS} days.`}
        />
      </div>
    </div>
  );
}

function Section({
  title,
  count,
  description,
  items,
  empty,
  className,
}: {
  title: string;
  count: number;
  description: string;
  items: Awaited<ReturnType<typeof getFollowUps>>;
  empty: string;
  className?: string;
}) {
  return (
    <Card className={cn("min-w-0 gap-4", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          {title}
          <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums">{count}</span>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {/* grid-cols-1 = minmax(0,1fr) so long names truncate inside the narrow column */}
      <CardContent className="grid grid-cols-1">
        {items.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">{empty}</p>
        ) : (
          <FollowUpList items={items} limit={500} />
        )}
      </CardContent>
    </Card>
  );
}
