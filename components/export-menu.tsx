"use client";

import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const EXPORTS = [
  { type: "patients", label: "Patients", hint: "One row per patient" },
  { type: "visits", label: "Visits & prescriptions", hint: "One row per visit, with patient details" },
  { type: "medicines", label: "Medicines & batches", hint: "One row per batch, with expiry status" },
] as const;

/** "Export" button with a list of CSV downloads (opens in Excel / Google Sheets). */
export function ExportMenu() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Download /> <span className="hidden sm:inline">Export CSV</span>
          <span className="sm:hidden">Export</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-1">
        <p className="text-muted-foreground px-2 py-1.5 text-xs font-medium">Download as CSV</p>
        {EXPORTS.map((e) => (
          <a
            key={e.type}
            href={`/api/export/${e.type}`}
            download
            className="hover:bg-accent flex items-start gap-2 rounded-sm px-2 py-2 text-sm"
          >
            <FileSpreadsheet className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <span>
              <span className="block font-medium">{e.label}</span>
              <span className="text-muted-foreground block text-xs">{e.hint}</span>
            </span>
          </a>
        ))}
      </PopoverContent>
    </Popover>
  );
}
