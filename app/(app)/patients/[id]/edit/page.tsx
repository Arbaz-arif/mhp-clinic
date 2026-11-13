import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientForm } from "@/components/patient-form";
import { updatePatient } from "@/app/actions/patients";
import { getPatient } from "@/lib/queries";

export default async function EditPatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Edit patient #{patient.patientNo}</CardTitle>
      </CardHeader>
      <CardContent>
        <PatientForm action={updatePatient.bind(null, id)} patient={patient} submitLabel="Save changes" />
      </CardContent>
    </Card>
  );
}
