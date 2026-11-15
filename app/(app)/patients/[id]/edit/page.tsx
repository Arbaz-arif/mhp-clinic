import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientForm } from "@/components/patient-form";
import { updatePatient } from "@/app/actions/patients";
import { getPatient } from "@/lib/queries";

export default async function EditPatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();

  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <BackLink href={`/patients/${patient.id}`}>
        {patient.name} · #{patient.patientNo}
      </BackLink>
    <Card>
      <CardHeader>
        <CardTitle>Edit patient #{patient.patientNo}</CardTitle>
      </CardHeader>
      <CardContent>
        <PatientForm action={updatePatient.bind(null, id)} patient={patient} submitLabel="Save changes" />
      </CardContent>
    </Card>
    </div>
  );
}
