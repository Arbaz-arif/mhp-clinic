import { BackLink } from "@/components/back-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MedicineForm } from "@/components/medicine-form";
import { createMedicine } from "@/app/actions/medicines";

export default function NewMedicinePage() {
  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <BackLink href="/medicines">Medicines</BackLink>
    <Card>
      <CardHeader>
        <CardTitle>Add medicine</CardTitle>
      </CardHeader>
      <CardContent>
        <MedicineForm action={createMedicine} submitLabel="Save medicine" />
      </CardContent>
    </Card>
    </div>
  );
}
