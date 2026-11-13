import Link from "next/link";
import { ExpiryBadge } from "@/components/expiry-badge";
import { cn, formatDate } from "@/lib/utils";
import type { ExpiryAlert } from "@/lib/expiry";

const DOT: Record<ExpiryAlert["level"], string> = {
  expired: "bg-red-600",
  critical: "bg-orange-500",
  warning: "bg-yellow-400",
};

/** Compact list of expiring batches. Safe to render on the server or inside a client component. */
export function ExpiryAlertList({
  alerts,
  onNavigate,
  className,
  emptyText = "Nothing expired or expiring in the next 90 days.",
}: {
  alerts: ExpiryAlert[];
  onNavigate?: () => void;
  className?: string;
  emptyText?: string;
}) {
  if (alerts.length === 0) {
    return <p className="text-muted-foreground py-4 text-center text-sm">{emptyText}</p>;
  }
  return (
    <ul className={cn("divide-y", className)}>
      {alerts.map((a) => (
        <li key={a.id}>
          <Link
            href={`/medicines/${a.medicineId}`}
            onClick={onNavigate}
            className="hover:bg-accent/60 flex items-center gap-3 rounded-sm px-2 py-2 text-sm"
          >
            <span className={cn("size-2 shrink-0 rounded-full", DOT[a.level])} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{a.medicineName}</span>
              <span className="text-muted-foreground block truncate text-xs">
                Batch {a.batchNumber} · {formatDate(a.expiryDate)} · Qty {a.quantity}
              </span>
            </span>
            <ExpiryBadge daysLeft={a.daysLeft} className="shrink-0" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Three coloured counters: expired / under 30 days / under 90 days. */
export function ExpiryCounts({ counts }: { counts: { expired: number; critical: number; warning: number } }) {
  const items = [
    { label: "Expired", value: counts.expired, cls: "border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40" },
    { label: "< 30 days", value: counts.critical, cls: "border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-950/40" },
    { label: "< 90 days", value: counts.warning, cls: "border-yellow-200 bg-yellow-50 text-yellow-800 dark:bg-yellow-950/40" },
  ];
  return (
    <div className="grid min-w-0 grid-cols-3 gap-2">
      {items.map((i) => (
        <div key={i.label} className={cn("min-w-0 rounded-lg border px-2.5 py-2", i.value === 0 && "opacity-60", i.cls)}>
          <div className="text-2xl leading-tight font-bold tabular-nums">{i.value}</div>
          <div className="text-[11px] leading-tight font-medium">{i.label}</div>
        </div>
      ))}
    </div>
  );
}
