"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The app's patient search. Submits to /search, which opens the profile for an exact
 * CNIC/mobile, offers registration if nobody has it, or lists matches for anything else.
 * Shown in the dashboard's action row, and in the top bar on every other page.
 */
export function SearchBar({ className, size = "default" }: { className?: string; size?: "default" | "lg" }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const current = pathname === "/search" ? (params.get("q") ?? "") : "";

  return (
    <form action="/search" role="search" className={cn("relative w-full min-w-0", className)}>
      <Search
        className={cn(
          "text-muted-foreground pointer-events-none absolute top-1/2 -translate-y-1/2",
          size === "lg" ? "left-3.5 size-[18px]" : "left-3 size-4",
        )}
      />
      <input
        key={`${pathname}?${current}`} // reset the text when the page/query changes
        name="q"
        type="search"
        defaultValue={current}
        placeholder={size === "lg" ? "Search patient: name, mobile or CNIC" : "Name, mobile or CNIC"}
        aria-label="Search patients by name, mobile number or CNIC"
        autoComplete="off"
        autoFocus={pathname === "/"}
        required
        className={cn(
          "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border text-base outline-none focus-visible:ring-[3px] md:text-sm",
          size === "lg"
            ? "bg-card h-10 pr-3 pl-10 shadow-xs"
            : "bg-muted/60 focus-visible:bg-background h-10 border-transparent pr-3 pl-9",
        )}
      />
    </form>
  );
}
