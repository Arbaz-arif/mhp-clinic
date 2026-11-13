import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MedicineForm } from "@/components/medicine-form";
import { createMedicine } from "@/app/actions/medicines";

export default function NewMedicinePage() {
  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Add medicine</CardTitle>
      </CardHeader>
      <CardContent>
        <MedicineForm action={createMedicine} submitLabel="Save medicine" />
      </CardContent>
    </Card>
  );
}
