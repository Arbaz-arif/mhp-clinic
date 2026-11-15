"use client";

import { useState } from "react";
import { Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { MedicineOption } from "@/lib/queries";

export type MedicineValue = { medicineId?: string; medicineName: string };

/**
 * Medicine name field for a prescription row.
 * Primary: a plain text box, the doctor types the medicine name.
 * Secondary: the search button opens the inventory list; picking an item fills the name
 * and links the row to that medicine (medicineId). Typing a name that exactly matches an
 * inventory item links it automatically; any other name is saved with medicineName only.
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
  const linked = value.medicineId ? options.find((o) => o.id === value.medicineId) : undefined;

  const typeName = (medicineName: string) => {
    const match = options.find((o) => o.name.toLowerCase() === medicineName.trim().toLowerCase());
    onChange({ medicineName, medicineId: match?.id });
  };

  const pick = (o: MedicineOption) => {
    onChange({ medicineId: o.id, medicineName: o.name });
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="grid gap-1">
      <div className="flex gap-1">
        <Input
          placeholder="Medicine name"
          aria-label="Medicine name"
          aria-invalid={invalid}
          autoComplete="off"
          value={value.medicineName}
          onChange={(ev) => typeName(ev.target.value)}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="icon" aria-label="Search inventory" title="Search inventory">
              <Search />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <Command>
              <CommandInput placeholder="Search inventory…" value={query} onValueChange={setQuery} />
              <CommandList>
                <CommandEmpty>No medicine in inventory matches.</CommandEmpty>
                <CommandGroup heading="Inventory">
                  {options.map((o) => (
                    <CommandItem
                      key={o.id}
                      value={`${o.name} ${o.id}`} // id keeps values unique if two medicines share a name
                      keywords={[o.name, o.form, o.manufacturer ?? ""]}
                      onSelect={() => pick(o)}
                    >
                      <Check className={cn(linked?.id === o.id ? "opacity-100" : "opacity-0")} />
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
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      {linked && (
        <p className="text-muted-foreground text-xs">
          In inventory · {linked.stock > 0 ? `${linked.stock} in stock` : <span className="text-destructive">out of stock</span>}
        </p>
      )}
    </div>
  );
}
