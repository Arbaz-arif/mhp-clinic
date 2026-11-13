import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientForm } from "@/components/patient-form";
import { createPatient } from "@/app/actions/patients";
import { param, type SearchParamValue } from "@/lib/utils";

export default async function NewPatientPage({
  searchParams,
}: {
  searchParams: Promise<{ cnic?: SearchParamValue; phone?: SearchParamValue }>;
}) {
  // Prefilled when coming from a Quick Lookup that found no patient. Length-capped; the form validates on save.
  const sp = await searchParams;
  const defaults = { cnic: param(sp.cnic).slice(0, 20), phone: param(sp.phone).slice(0, 20) };

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Register new patient</CardTitle>
      </CardHeader>
      <CardContent>
        <PatientForm action={createPatient} defaults={defaults} submitLabel="Save patient" />
      </CardContent>
    </Card>
  );
}
