import { cn } from "@/lib/utils";
import type { DailyVisits } from "@/lib/dashboard";

const dayFmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso + "T00:00:00.000Z").toLocaleDateString("en-GB", { timeZone: "UTC", ...opts });

/** Axis top: a clean number whose half is also a whole number (ticks 0 / 3 / 6, 0 / 20 / 40, never 2.5). */
function niceMax(max: number) {
  if (max <= 4) return 4;
  if (max <= 20) return Math.ceil(max / 2) * 2;
  const half = 10 ** Math.floor(Math.log10(max)) / 2; // 37 → 5, 130 → 50
  return Math.ceil(max / (half * 2)) * half * 2;
}

/**
 * Visits per day as columns (single series: one hue, no legend; the title names it).
 * Columns ≤24px, 4px rounded tops, square at the baseline; hairline grid; only the busiest
 * day and today are labelled. Hover/focus a column for its tooltip; a table is provided for
 * screen readers.
 */
export function VisitsChart({ daily }: { daily: DailyVisits }) {
  const max = Math.max(...daily.map((d) => d.count));
  const top = niceMax(max);
  const ticks = [top, top / 2, 0];
  const peakIndex = max > 0 ? daily.findIndex((d) => d.count === max) : -1;
  const last = daily.length - 1;

  return (
    <figure className="grid gap-2">
      <div className="flex h-44 gap-2 sm:h-52">
        {/* Y axis */}
        <div className="text-muted-foreground flex w-6 shrink-0 flex-col justify-between pb-6 text-right text-[11px] tabular-nums" aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="-translate-y-1/2 first:translate-y-0 last:translate-y-1/2">
              {t}
            </span>
          ))}
        </div>

        <div className="relative flex min-w-0 flex-1 flex-col">
          {/* Plot */}
          <div className="relative flex-1">
            {/* Hairline gridlines (top, middle) + baseline */}
            <div className="border-border/70 absolute inset-x-0 top-0 border-t" aria-hidden />
            <div className="border-border/70 absolute inset-x-0 top-1/2 border-t" aria-hidden />
            <div className="border-border absolute inset-x-0 bottom-0 border-t" aria-hidden />
            {max === 0 && (
              <p className="text-muted-foreground absolute inset-0 flex items-center justify-center text-sm">
                No visits in the last {daily.length} days yet.
              </p>
            )}

            <ol className="absolute inset-0 flex items-end" aria-label={`Visits per day, last ${daily.length} days`}>
              {daily.map((d, i) => {
                const pct = top ? (d.count / top) * 100 : 0;
                const isToday = i === last;
                const showLabel = d.count > 0 && (i === peakIndex || isToday);
                const tipAlign = i < 2 ? "left-0" : i > last - 2 ? "right-0" : "left-1/2 -translate-x-1/2";
                return (
                  <li
                    key={d.date}
                    // The whole column slot is the hit target (bigger than the mark).
                    tabIndex={0}
                    className="group relative flex h-full flex-1 items-end justify-center outline-none"
                  >
                    {/* What screen readers announce for this column */}
                    <span className="sr-only">
                      {isToday ? "Today, " : ""}
                      {dayFmt(d.date, { weekday: "long", day: "numeric", month: "long" })}: {d.count} visit
                      {d.count === 1 ? "" : "s"}
                    </span>
                    <div className="relative flex h-full w-full max-w-6 items-end px-[1px]" aria-hidden>
                      <div
                        className={cn(
                          "w-full rounded-t-[4px] bg-[#047857] transition-opacity",
                          "group-hover:opacity-80 group-focus-visible:ring-2 group-focus-visible:ring-[#047857]/40",
                          d.count === 0 && "bg-transparent",
                        )}
                        style={{ height: `${pct}%` }}
                      />
                      {showLabel && (
                        <span
                          className="text-foreground absolute left-1/2 -translate-x-1/2 text-[11px] font-semibold tabular-nums"
                          style={{ bottom: `calc(${pct}% + 2px)` }}
                        >
                          {d.count}
                        </span>
                      )}
                    </div>

                    {/* Tooltip: value leads, label follows */}
                    <div
                      aria-hidden
                      className={cn(
                        "bg-popover text-popover-foreground pointer-events-none absolute bottom-[calc(100%+4px)] z-10 hidden w-max rounded-md border px-2.5 py-1.5 text-xs shadow-md",
                        "group-hover:block group-focus-visible:block",
                        tipAlign,
                      )}
                    >
                      <span className="block text-sm font-semibold tabular-nums">
                        {d.count} visit{d.count === 1 ? "" : "s"}
                      </span>
                      <span className="text-muted-foreground">
                        {isToday ? "Today, " : ""}
                        {dayFmt(d.date, { weekday: "short", day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* X axis: every day on wider screens, every other day on phones; "Today" at the end */}
          <ol className="text-muted-foreground flex h-6 items-end text-[10px] tabular-nums sm:text-[11px]" aria-hidden>
            {daily.map((d, i) => (
              <li
                key={d.date}
                className={cn(
                  "flex-1 text-center whitespace-nowrap",
                  i !== last && (last - i) % 2 === 1 && "max-sm:invisible",
                  i === last && "text-foreground font-medium",
                )}
              >
                {i === last ? "Today" : dayFmt(d.date, { day: "numeric" })}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </figure>
  );
}
