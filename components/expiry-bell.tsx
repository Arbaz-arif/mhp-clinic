"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ExpiryAlertList } from "@/components/expiry-alert-list";
import { cn } from "@/lib/utils";
import type { ExpiryAlert } from "@/lib/expiry";

/** Navbar bell: alert count badge + dropdown of the most urgent batches. */
export function ExpiryBell({
  total,
  hasExpired,
  top,
}: {
  total: number;
  hasExpired: boolean;
  top: ExpiryAlert[];
}) {
  const [open, setOpen] = useState(false);
  const label = total === 0 ? "No expiry alerts" : `${total} expiry alert${total === 1 ? "" : "s"}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={label} title={label}>
          <Bell className="size-5" />
          {total > 0 && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white",
                hasExpired ? "bg-red-600" : "bg-orange-500",
              )}
            >
              {total > 99 ? "99+" : total}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold">Expiry alerts</p>
          <span className="text-muted-foreground text-xs">{label}</span>
        </div>
        <ExpiryAlertList alerts={top} onNavigate={() => setOpen(false)} className="max-h-80 overflow-y-auto px-1 py-1" />
        <div className="border-t p-2">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href="/alerts" onClick={() => setOpen(false)}>
              {total > top.length ? `View all ${total} alerts` : "Open alerts page"}
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
