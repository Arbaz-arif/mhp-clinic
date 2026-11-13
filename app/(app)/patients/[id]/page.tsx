import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/form-bits";
import { PatientSummary } from "@/components/patient-summary";
import { VisitList } from "@/components/visit-list";
import { deletePatient } from "@/app/actions/patients";
import { countVisitsForPatient, getPatient, getVisitsForPatient } from "@/lib/queries";

const RECENT_VISITS = 5;

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();

  // Visit.find({ patientId }).sort({ visitDate: -1 }).limit(5)
  const [recentVisits, totalVisits] = await Promise.all([
    getVisitsForPatient(id, RECENT_VISITS),
    countVisitsForPatient(id),
  ]);

  return (
    <div className="grid gap-6">
      <PatientSummary
        patient={patient}
        totalVisits={totalVisits}
        extraActions={
          <ConfirmDeleteButton
            action={deletePatient.bind(null, id)}
            confirmText={`Delete ${patient.name} and ALL their visits? This cannot be undone.`}
          />
        }
      />

      <section className="grid gap-3" aria-labelledby="recent-visits">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="recent-visits" className="text-lg font-semibold">
            Last {RECENT_VISITS} Visits
          </h2>
          <div className="flex items-center gap-2">
            {totalVisits > 0 && (
              <Button asChild variant="ghost" size="sm">
                <Link href={`/patients/${id}/visits`}>View all visits ({totalVisits})</Link>
              </Button>
            )}
            <Button asChild>
              <Link href={`/patients/${id}/visits/new`}>
                <Plus /> New Visit
              </Link>
            </Button>
          </div>
        </div>
        <VisitList visits={recentVisits} />
      </section>
    </div>
  );
}
