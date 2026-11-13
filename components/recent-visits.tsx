import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/components/dashboard/follow-up-list";
import { formatDate, startOfTodayUTC } from "@/lib/utils";
import type { RecentVisitDTO } from "@/lib/queries";

const MAX_BADGES = 2;

/** Latest visits across all patients. Each row opens the visit. */
export function RecentVisits({ visits }: { visits: RecentVisitDTO[] }) {
  if (visits.length === 0) {
    return <p className="text-muted-foreground py-8 text-center text-sm">No visits recorded yet.</p>;
  }
  const today = startOfTodayUTC().toISOString();

  return (
    <ul className="-mx-2 divide-y">
      {visits.map((v) => {
        const extra = v.medicines.length - MAX_BADGES;
        return (
          <li key={v.id}>
            <Link href={`/visits/${v.id}`} className="hover:bg-accent/60 flex items-start gap-3 rounded-md px-2 py-3">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-50 text-xs font-semibold text-sky-700"
                aria-hidden
              >
                {v.patient ? initials(v.patient.name) : "?"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-medium">
                    {v.patient?.name ?? "Deleted patient"}
                    {v.patient && <span className="text-muted-foreground ml-1.5 text-xs font-normal">#{v.patient.patientNo}</span>}
                  </p>
                  <time dateTime={v.visitDate} className="text-muted-foreground shrink-0 text-xs">
                    {v.visitDate === today ? "Today" : formatDate(v.visitDate)}
                  </time>
                </div>
                <p className="text-muted-foreground line-clamp-1 text-sm">{v.complaints}</p>
                {v.medicines.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {v.medicines.slice(0, MAX_BADGES).map((m, i) => (
                      <Badge key={i} variant="secondary" className="font-normal">
                        {m}
                      </Badge>
                    ))}
                    {extra > 0 && <Badge variant="outline">+{extra} more</Badge>}
                  </div>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
