import Link from "next/link";
import { cn } from "@/lib/utils";

/** Switch between the per-medicine and per-batch inventory views. */
export function InventoryTabs({ active }: { active: "medicines" | "batches" }) {
  const tab = (key: typeof active, href: string, label: string) => (
    <Link
      href={href}
      aria-current={active === key ? "page" : undefined}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active === key ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
  return (
    <nav className="bg-muted inline-flex w-fit gap-1 rounded-lg p-1" aria-label="Inventory views">
      {tab("medicines", "/medicines", "Medicines")}
      {tab("batches", "/medicines/batches", "All batches")}
    </nav>
  );
}
