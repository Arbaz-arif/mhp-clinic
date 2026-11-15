import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VisitForm } from "@/components/visit-form";
import { createVisit } from "@/app/actions/visits";
import { getPatient, getPreviousPrescription, medicineOptions } from "@/lib/queries";
import { todayPK } from "@/lib/utils";

export default async function NewVisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [patient, medicines, previous] = await Promise.all([getPatient(id), medicineOptions(), getPreviousPrescription(id)]);
  if (!patient) notFound();

  return (
    <div className="mx-auto grid max-w-4xl gap-4">
      <BackLink href={`/patients/${id}`}>
        {patient.name} · #{patient.patientNo}
      </BackLink>
    <Card>
      <CardHeader>
        <CardTitle>New visit</CardTitle>
        <CardDescription>
          {patient.name} · ID #{patient.patientNo}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <VisitForm action={createVisit.bind(null, id)} today={todayPK()}
          medicines={medicines}
          previous={previous}
          submitLabel="Save visit" />
      </CardContent>
    </Card>
    </div>
  );
}
