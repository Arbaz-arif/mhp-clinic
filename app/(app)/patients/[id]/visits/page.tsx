import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VisitList } from "@/components/visit-list";
import { getPatient, getVisitsForPatient } from "@/lib/queries";

export default async function AllVisitsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();
  const visits = await getVisitsForPatient(id); // all, newest first

  return (
    <div className="grid gap-4">
      <Link href={`/patients/${id}`} className="text-muted-foreground flex w-fit items-center gap-1 text-sm hover:underline">
        <ArrowLeft className="size-4" /> {patient.name}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">
          All visits <span className="text-muted-foreground font-normal">({visits.length})</span>
        </h1>
        <Button asChild>
          <Link href={`/patients/${id}/visits/new`}>
            <Plus /> New Visit
          </Link>
        </Button>
      </div>
      <VisitList visits={visits} />
    </div>
  );
}
