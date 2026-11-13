import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BatchManager } from "@/components/batch-manager";
import { ConfirmDeleteButton } from "@/components/form-bits";
import { deleteMedicine } from "@/app/actions/medicines";
import { getMedicine } from "@/lib/queries";

export default async function MedicinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const medicine = await getMedicine(id);
  if (!medicine) notFound();

  return (
    <div className="grid gap-4">
      <Link href="/medicines" className="text-muted-foreground flex w-fit items-center gap-1 text-sm hover:underline">
        <ArrowLeft className="size-4" /> Medicines
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{medicine.name}</CardTitle>
          <CardDescription className="capitalize">
            {medicine.form}
            {medicine.manufacturer && <span className="normal-case"> · {medicine.manufacturer}</span>}
          </CardDescription>
          <CardAction className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/medicines/${id}/edit`}>
                <Pencil /> Edit
              </Link>
            </Button>
            <ConfirmDeleteButton
              action={deleteMedicine.bind(null, id)}
              confirmText={`Delete ${medicine.name} and all ${medicine.batches.length} batch(es)? Past prescriptions keep the name.`}
            />
          </CardAction>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Batches</CardTitle>
          <CardDescription>Sorted by expiry, soonest first.</CardDescription>
        </CardHeader>
        <CardContent>
          <BatchManager medicineId={id} batches={medicine.batches} />
        </CardContent>
      </Card>
    </div>
  );
}
