"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { MedicineOption } from "@/lib/queries";

export type MedicineValue = { medicineId?: string; medicineName: string };

/**
 * Searchable dropdown over the Medicine collection.
 * Picking an item sets both medicineId and medicineName; typing a name that isn't
 * in inventory can still be used (saved with medicineName only).
 */
export function MedicineCombobox({
  options,
  value,
  onChange,
  invalid,
}: {
  options: MedicineOption[];
  value: MedicineValue;
  onChange: (v: MedicineValue) => void;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = value.medicineId ? options.find((o) => o.id === value.medicineId) : undefined;
  const typed = query.trim();
  const exactMatch = options.some((o) => o.name.toLowerCase() === typed.toLowerCase());

  const pick = (v: MedicineValue) => {
    onChange(v);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          className="aria-invalid:border-destructive w-full justify-between font-normal"
        >
          <span className={cn("truncate", !value.medicineName && "text-muted-foreground")}>
            {value.medicineName || "Search medicine…"}
            {value.medicineName && !value.medicineId && <span className="text-muted-foreground"> (not in inventory)</span>}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Type to search inventory…" value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>No medicine in inventory matches.</CommandEmpty>
            <CommandGroup heading="Inventory">
              {options.map((o) => (
                <CommandItem
                  key={o.id}
                  value={`${o.name} ${o.id}`} // id keeps values unique if two medicines share a name
                  keywords={[o.name, o.form, o.manufacturer ?? ""]}
                  onSelect={() => pick({ medicineId: o.id, medicineName: o.name })}
                >
                  <Check className={cn(selected?.id === o.id ? "opacity-100" : "opacity-0")} />
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <span className="truncate">
                      {o.name} <span className="text-muted-foreground text-xs capitalize">· {o.form}</span>
                    </span>
                    <span className={cn("shrink-0 text-xs", o.stock > 0 ? "text-muted-foreground" : "text-destructive")}>
                      {o.stock > 0 ? `${o.stock} in stock` : "out of stock"}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {typed && !exactMatch && (
              <CommandGroup heading="Not in inventory">
                {/* forceMount keeps this option visible even when the filter hides everything else */}
                <CommandItem value={`__custom__ ${typed}`} forceMount onSelect={() => pick({ medicineName: typed })}>
                  <Plus /> Use “{typed}”
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
