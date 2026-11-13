"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** On-screen controls for the print page; hidden when printing. */
export function PrintToolbar({ backHref, autoPrint }: { backHref: string; autoPrint?: boolean }) {
  useEffect(() => {
    if (autoPrint) window.print();
  }, [autoPrint]);

  return (
    <div className="mx-auto flex w-[148mm] max-w-full items-center justify-between gap-2 py-4 print:hidden">
      <Button asChild variant="ghost" size="sm">
        <Link href={backHref}>
          <ArrowLeft /> Back to visit
        </Link>
      </Button>
      <Button size="sm" onClick={() => window.print()}>
        <Printer /> Print (A5)
      </Button>
    </div>
  );
}
