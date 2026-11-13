import { notFound } from "next/navigation";
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
    <Card className="mx-auto max-w-4xl">
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
  );
}
