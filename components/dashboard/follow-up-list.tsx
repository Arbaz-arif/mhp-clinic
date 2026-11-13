import Link from "next/link";
import { AlertCircle, CalendarClock, Clock } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { FollowUp } from "@/lib/dashboard";

/** "Dr. Akram Bhatti" → "AB" (titles like Dr/Mr/Mrs/Ms/Prof/Hakeem are skipped). */
export function initials(name: string) {
  const all = name.trim().split(/\s+/);
  const titles = /^(dr|mr|mrs|ms|miss|prof|hakeem|hakim|sheikh|syed)\.?$/i;
  const rest = all.filter((p) => !titles.test(p));
  const parts = rest.length ? rest : all;
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** Status with an icon + words, never colour alone. */
function DueBadge({ days }: { days: number }) {
  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-600/15 ring-inset">
        <AlertCircle className="size-3" aria-hidden /> Overdue {-days}d
      </span>
    );
  }
  if (days === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-1.5 py-0.5 text-xs font-medium text-orange-700 ring-1 ring-orange-600/15 ring-inset">
        <Clock className="size-3" aria-hidden /> Today
      </span>
    );
  }
  return (
    <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium">
      <CalendarClock className="size-3" aria-hidden /> {days === 1 ? "Tomorrow" : `In ${days} days`}
    </span>
  );
}

/** Patients whose latest visit asked them to come back: overdue, today, and the next 7 days. */
export function FollowUpList({ items, limit = 6 }: { items: FollowUp[]; limit?: number }) {
  if (items.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center text-sm">
        <CalendarClock className="size-6 opacity-50" aria-hidden />
        No follow-ups due in the next 7 days.
      </div>
    );
  }

  return (
    <ul className="-mx-2 divide-y">
      {items.slice(0, limit).map((f) => (
        <li key={f.patientId}>
          <Link
            href={`/patients/${f.patientId}`}
            className="hover:bg-accent/60 flex items-center gap-3 rounded-md px-2 py-2.5"
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                f.daysFromToday < 0 ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700",
              )}
              aria-hidden
            >
              {initials(f.patientName)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{f.patientName}</span>
              <span className="text-muted-foreground block truncate text-xs">
                {f.phone ?? `#${f.patientNo}`} · {formatDate(f.followUpDate)}
              </span>
            </span>
            <DueBadge days={f.daysFromToday} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
