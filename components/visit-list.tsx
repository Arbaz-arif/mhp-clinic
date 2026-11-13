import Link from "next/link";
import { CalendarClock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate, startOfTodayUTC } from "@/lib/utils";
import type { VisitDTO } from "@/lib/queries";

/** Compact, clickable visit rows: date, complaints and medicines. Each opens the full visit. */
export function VisitList({ visits }: { visits: VisitDTO[] }) {
  if (visits.length === 0) {
    return <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">No visits recorded yet.</p>;
  }

  const today = startOfTodayUTC().toISOString();

  return (
    <ul className="divide-y rounded-xl border bg-card">
      {visits.map((v) => {
        const followUpDue = v.followUpDate && v.followUpDate <= today;
        return (
          <li key={v.id}>
            <Link
              href={`/visits/${v.id}`}
              className="hover:bg-accent/60 focus-visible:bg-accent/60 grid grid-cols-[auto_1fr_auto] items-start gap-4 p-4 outline-none transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              <time dateTime={v.visitDate} className="w-24 text-sm font-semibold">
                {formatDate(v.visitDate)}
              </time>

              <div className="grid min-w-0 gap-2">
                <p className="line-clamp-2 text-sm">{v.complaints}</p>
                {v.prescription.items.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {v.prescription.items.map((item, i) => (
                      <Badge key={i} variant="secondary">
                        {item.medicineName} {item.potency}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs">No medicines prescribed</p>
                )}
                {v.followUpDate && (
                  <p className={`flex items-center gap-1 text-xs ${followUpDue ? "text-amber-600" : "text-muted-foreground"}`}>
                    <CalendarClock className="size-3.5" />
                    Follow-up {formatDate(v.followUpDate)}
                  </p>
                )}
              </div>

              <ChevronRight className="text-muted-foreground mt-0.5 size-4" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
