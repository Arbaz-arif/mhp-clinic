import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MedicineForm } from "@/components/medicine-form";
import { updateMedicine } from "@/app/actions/medicines";
import { getMedicine } from "@/lib/queries";

export default async function EditMedicinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const medicine = await getMedicine(id);
  if (!medicine) notFound();

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Edit {medicine.name}</CardTitle>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/medicines/${id}`}>Cancel</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <MedicineForm action={updateMedicine.bind(null, id)} medicine={medicine} submitLabel="Save changes" />
      </CardContent>
    </Card>
  );
}
