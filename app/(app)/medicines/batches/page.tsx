import Link from "next/link";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InventoryTabs } from "@/components/inventory-tabs";
import { BatchTable } from "@/components/medicine-table";
import { BATCH_FILTERS, listBatches, type BatchFilter } from "@/lib/queries";
import { cn, param, type SearchParamValue } from "@/lib/utils";

export const metadata = { title: "Batches · MHP Clinic" };

const FILTER_LABELS: Record<BatchFilter, string> = {
  all: "All",
  expired: "Expired",
  critical: "Under 30 days",
  warning: "30 to 90 days",
};
const ACTIVE_TONE: Partial<Record<BatchFilter, string>> = {
  expired: "text-red-700",
  critical: "text-orange-700",
  warning: "text-yellow-800",
};

type Params = { filter?: string; dir?: string; q?: string; stock?: string };

/**
 * One row per batch. Filters: All / Expired / Under 30 days / 30 to 90 days, optional
 * "in stock only" (what the Expiry Alerts cards count), text search, sort by expiry.
 */
export default async function BatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: SearchParamValue; dir?: SearchParamValue; q?: SearchParamValue; stock?: SearchParamValue }>;
}) {
  const sp = await searchParams;
  const rawFilter = param(sp.filter);
  const filter: BatchFilter = BATCH_FILTERS.includes(rawFilter as BatchFilter) ? (rawFilter as BatchFilter) : "all";
  const dir = param(sp.dir) === "desc" ? "desc" : "asc";
  const q = param(sp.q);
  const inStockOnly = param(sp.stock) === "in";

  const batches = await listBatches({ filter, dir, q, inStockOnly });

  // Build links that change one setting and keep the others.
  const href = (patch: Partial<Params>) => {
    const p = new URLSearchParams();
    const merged = { filter, dir, q, stock: inStockOnly ? "in" : "", ...patch };
    if (merged.filter !== "all") p.set("filter", merged.filter!);
    if (merged.dir !== "asc") p.set("dir", merged.dir!);
    if (merged.q) p.set("q", merged.q);
    if (merged.stock === "in") p.set("stock", "in");
    const s = p.toString();
    return `/medicines/batches${s ? `?${s}` : ""}`;
  };

  return (
    <div className="grid gap-4">
      <InventoryTabs active="batches" />
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{filter === "all" ? "All batches" : `Batches: ${FILTER_LABELS[filter]}`}</CardTitle>
          <CardDescription>
            One row per batch · {batches.length} shown · total quantity {batches.reduce((sum, b) => sum + b.quantity, 0)}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Scrolls sideways on very narrow phones instead of overflowing the page */}
            <div className="max-w-full overflow-x-auto">
              <nav className="bg-muted inline-flex gap-1 rounded-lg p-1 whitespace-nowrap" aria-label="Filter batches by expiry">
                {BATCH_FILTERS.map((f) => (
                  <Link
                    key={f}
                    href={href({ filter: f })}
                    aria-current={filter === f ? "page" : undefined}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium",
                      filter === f ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
                      filter === f && ACTIVE_TONE[f],
                    )}
                  >
                    {FILTER_LABELS[f]}
                  </Link>
                ))}
              </nav>
            </div>
            <form className="flex flex-1 gap-2 sm:max-w-sm" action="/medicines/batches" role="search">
              {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
              {dir !== "asc" && <input type="hidden" name="dir" value={dir} />}
              {inStockOnly && <input type="hidden" name="stock" value="in" />}
              <Input name="q" defaultValue={q} aria-label="Search batches" placeholder="Medicine or batch number" />
              <Button type="submit" variant="outline" size="icon" aria-label="Search">
                <Search />
              </Button>
            </form>
          </div>

          <div className="flex items-center gap-2 text-sm">
            {inStockOnly ? (
              <Link
                href={href({ stock: "" })}
                className="bg-accent text-accent-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium hover:underline"
              >
                In stock only <X className="size-3.5" aria-hidden />
                <span className="sr-only">: show empty batches too</span>
              </Link>
            ) : (
              <Link href={href({ stock: "in" })} className="text-muted-foreground hover:text-foreground hover:underline">
                Show in-stock batches only
              </Link>
            )}
          </div>

          <BatchTable batches={batches} sort={{ dir, href: (d) => href({ dir: d }) }} />
        </CardContent>
      </Card>
    </div>
  );
}
