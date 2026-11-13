import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExpiryBadge } from "@/components/expiry-badge";
import type { ExpiringBatchDTO, MedicineDTO } from "@/lib/queries";
import { cn, expiryStatus, formatDate } from "@/lib/utils";

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** One row per medicine, summarising its batches. */
export function MedicineTable({ medicines }: { medicines: MedicineDTO[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Medicine</TableHead>
          <TableHead>Form</TableHead>
          <TableHead>Manufacturer</TableHead>
          <TableHead className="text-right">Batches</TableHead>
          <TableHead>Nearest expiry (in stock)</TableHead>
          <TableHead className="text-right">Usable stock</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {medicines.map((m) => {
          const usable = m.batches.filter((b) => b.quantity > 0 && expiryStatus(b.expiryDate).status !== "expired");
          const nearest = m.batches.find((b) => b.quantity > 0); // batches are sorted by expiry
          const stock = usable.reduce((sum, b) => sum + b.quantity, 0);
          return (
            <TableRow key={m.id}>
              <TableCell className="font-medium">
                <Link href={`/medicines/${m.id}`} className="hover:underline">
                  {m.name}
                </Link>
              </TableCell>
              <TableCell>{cap(m.form)}</TableCell>
              <TableCell className="text-muted-foreground">{m.manufacturer ?? "—"}</TableCell>
              <TableCell className="text-right">{m.batches.length}</TableCell>
              <TableCell>
                {nearest ? (
                  <span className="flex items-center gap-2">
                    {formatDate(nearest.expiryDate)} <ExpiryBadge expiryDate={nearest.expiryDate} />
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className={cn("text-right", stock === 0 && "text-destructive font-medium")}>{stock}</TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/medicines/${m.id}`} aria-label={`Open ${m.name}`}>
                    Open <ChevronRight />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
        {medicines.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-muted-foreground py-6 text-center">
              No medicines found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

/**
 * One row per batch (from the $unwind aggregation).
 * Pass `sortHref` to make the Expiry header a sort toggle.
 */
export function BatchTable({
  batches,
  sort,
}: {
  batches: ExpiringBatchDTO[];
  sort?: { dir: "asc" | "desc"; href: (dir: "asc" | "desc") => string };
}) {
  const next = sort?.dir === "asc" ? "desc" : "asc";
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Medicine</TableHead>
          <TableHead>Form</TableHead>
          <TableHead>Batch</TableHead>
          <TableHead aria-sort={sort ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}>
            {sort ? (
              <Link href={sort.href(next)} className="hover:text-primary inline-flex items-center gap-1" title={`Sort ${next === "asc" ? "soonest" : "latest"} first`}>
                Expiry date {sort.dir === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
              </Link>
            ) : (
              "Expiry date"
            )}
          </TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {batches.map((b) => (
          <TableRow key={b.id} className={b.quantity === 0 ? "text-muted-foreground" : undefined}>
            <TableCell className="font-medium">
              <Link href={`/medicines/${b.medicineId}`} className="hover:underline">
                {b.medicineName}
              </Link>
            </TableCell>
            <TableCell>{cap(b.form)}</TableCell>
            <TableCell>{b.batchNumber}</TableCell>
            <TableCell>{formatDate(b.expiryDate)}</TableCell>
            <TableCell>
              <ExpiryBadge expiryDate={b.expiryDate} />
            </TableCell>
            <TableCell className="text-right">{b.quantity}</TableCell>
            <TableCell className="text-right">
              <Button asChild variant="ghost" size="sm">
                <Link href={`/medicines/${b.medicineId}`} aria-label={`Manage batches of ${b.medicineName}`}>
                  Manage <ChevronRight />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {batches.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-muted-foreground py-6 text-center">
              No batches match.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
