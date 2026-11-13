import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ExportMenu } from "@/components/export-menu";
import { InventoryTabs } from "@/components/inventory-tabs";
import { MedicineTable } from "@/components/medicine-table";
import { listMedicines } from "@/lib/queries";
import { param, type SearchParamValue } from "@/lib/utils";

export const metadata = { title: "Medicines · MHP Clinic" };

export default async function MedicinesPage({ searchParams }: { searchParams: Promise<{ q?: SearchParamValue }> }) {
  const q = param((await searchParams).q);
  const medicines = await listMedicines(q);

  return (
    <div className="grid gap-4">
      <InventoryTabs active="medicines" />
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Medicine inventory</CardTitle>
          <CardDescription>{medicines.length} medicine(s){q && ` matching “${q}”`}</CardDescription>
          <CardAction>
            <ExportMenu />
            <Button asChild size="sm">
              <Link href="/medicines/new">
                <Plus /> Add medicine
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form className="flex gap-2" action="/medicines" role="search">
            <Input name="q" defaultValue={q} aria-label="Search medicines" placeholder="Search by name, manufacturer or batch number" />
            <Button type="submit" variant="outline">
              <Search /> Search
            </Button>
          </form>
          <MedicineTable medicines={medicines} />
        </CardContent>
      </Card>
    </div>
  );
}
