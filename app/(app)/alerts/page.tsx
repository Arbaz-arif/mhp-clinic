import Link from "next/link";
import { AlertTriangle, CircleAlert, Clock, Hourglass, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BatchTable } from "@/components/medicine-table";
import { ExpiryAlertList } from "@/components/expiry-alert-list";
import { getExpiryReport, type ExpiryAlert } from "@/lib/expiry";
import { cn, param, type SearchParamValue } from "@/lib/utils";

export const metadata = { title: "Expiry alerts · MHP Clinic" };

const TABS = ["expired", "critical", "warning"] as const;
type Tab = (typeof TABS)[number];

const TAB_INFO: Record<
  Tab,
  { label: string; short: string; hint: string; empty: string; icon: LucideIcon; active: string; badge: string; bar: string }
> = {
  expired: {
    label: "Expired",
    short: "Expired",
    hint: "Do not dispense. Remove these from stock, then set the batch quantity to 0.",
    empty: "No expired stock.",
    icon: CircleAlert,
    active: "text-red-700",
    badge: "bg-red-50 text-red-700 ring-red-600/15",
    bar: "bg-red-600",
  },
  critical: {
    label: "Under 30 days",
    short: "< 30 days",
    hint: "Expiring within a month. Use these first.",
    empty: "Nothing expiring in the next 30 days.",
    icon: Clock,
    active: "text-orange-700",
    badge: "bg-orange-50 text-orange-700 ring-orange-600/15",
    bar: "bg-orange-500",
  },
  warning: {
    label: "30 to 90 days",
    short: "30–90 days",
    hint: "Expiring in 1 to 3 months. Plan reorders.",
    empty: "Nothing expiring in 30 to 90 days.",
    icon: Hourglass,
    active: "text-yellow-800",
    badge: "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
    bar: "bg-yellow-400",
  },
};

/** Expiry alerts as tabs; the selected tab's batches are listed underneath. */
export default async function AlertsPage({ searchParams }: { searchParams: Promise<{ tab?: SearchParamValue }> }) {
  const { expired, expiring } = await getExpiryReport();
  const lists: Record<Tab, ExpiryAlert[]> = {
    expired,
    critical: expiring.filter((a) => a.level === "critical"),
    warning: expiring.filter((a) => a.level === "warning"),
  };

  // Selected tab from the URL; otherwise the most urgent tab that has something in it.
  const requested = param((await searchParams).tab) as Tab;
  const tab: Tab = TABS.includes(requested) ? requested : (TABS.find((t) => lists[t].length > 0) ?? "expired");
  const info = TAB_INFO[tab];
  const rows = lists[tab];

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold sm:text-2xl">
          <AlertTriangle className="text-muted-foreground size-5" aria-hidden /> Expiry alerts
        </h1>
        <p className="text-muted-foreground text-sm">
          In-stock batches only.{" "}
          <Link href="/medicines/batches" className="text-primary hover:underline">
            All batches →
          </Link>
        </p>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        {/* Tabs (links, so the selected tab is in the URL). Phones: short labels, no icons, so all three fit. */}
        <nav className="border-b" aria-label="Expiry level">
          <ul className="grid grid-cols-3">
            {TABS.map((t) => {
              const ti = TAB_INFO[t];
              const selected = t === tab;
              const Icon = ti.icon;
              return (
                <li key={t} className="min-w-0">
                  <Link
                    href={`/alerts?tab=${t}`}
                    aria-current={selected ? "page" : undefined}
                    className={cn(
                      "relative flex items-center justify-center gap-1.5 px-1.5 py-3.5 text-[13px] font-medium whitespace-nowrap transition-colors sm:gap-2 sm:px-6 sm:text-sm",
                      selected ? cn("bg-card", ti.active) : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    )}
                  >
                    <Icon className="hidden size-4 sm:block" aria-hidden />
                    <span className="sm:hidden">{ti.short}</span>
                    <span className="hidden sm:inline">{ti.label}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ring-1 ring-inset",
                        selected || lists[t].length > 0 ? ti.badge : "bg-muted text-muted-foreground ring-transparent",
                      )}
                    >
                      {lists[t].length}
                    </span>
                    {/* Underline in the level's colour marks the selected tab */}
                    {selected && <span className={cn("absolute inset-x-3 bottom-0 h-0.5 rounded-full", ti.bar)} aria-hidden />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <CardContent className="grid gap-3 py-5">
          <p className="text-muted-foreground text-sm">{info.hint}</p>
          {rows.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-sm">
              <info.icon className="size-6 opacity-40" aria-hidden />
              {info.empty}
            </div>
          ) : (
            <>
              {/* Phones: compact list. Tablet/desktop: full table. */}
              <ExpiryAlertList alerts={rows} className="-mx-2 md:hidden" />
              <div className="hidden md:block">
                <BatchTable batches={rows} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
