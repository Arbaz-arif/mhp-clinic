import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDeleteButton } from "@/components/form-bits";
import { VisitForm } from "@/components/visit-form";
import { deleteVisit, updateVisit } from "@/app/actions/visits";
import { getPatient, getPreviousPrescription, getVisit, medicineOptions } from "@/lib/queries";
import { todayPK } from "@/lib/utils";

export default async function EditVisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const visit = await getVisit(id);
  if (!visit) notFound();
  const [patient, medicines, previous] = await Promise.all([
    getPatient(visit.patientId),
    medicineOptions(),
    getPreviousPrescription(visit.patientId, { id: visit.id, visitDate: visit.visitDate }),
  ]);

  return (
    <Card className="mx-auto max-w-4xl">
      <CardHeader>
        <CardTitle>Edit visit</CardTitle>
        <CardDescription>
          {patient ? (
            <Link href={`/patients/${patient.id}`} className="hover:underline">
              {patient.name} · ID #{patient.patientNo}
            </Link>
          ) : (
            "Unknown patient"
          )}
        </CardDescription>
        <CardAction className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/visits/${id}`}>Cancel</Link>
          </Button>
          <ConfirmDeleteButton action={deleteVisit.bind(null, id)} confirmText="Delete this visit and its prescription?" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <VisitForm
          action={updateVisit.bind(null, id)}
          visit={visit}
          today={todayPK()}
          medicines={medicines}
          previous={previous}
          submitLabel="Save changes"
        />
      </CardContent>
    </Card>
  );
}
