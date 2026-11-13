import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PatientDTO } from "@/lib/queries";

/** Patient details card with an Edit button. `extraActions` adds buttons next to Edit. */
export function PatientSummary({
  patient,
  totalVisits,
  extraActions,
}: {
  patient: PatientDTO;
  totalVisits: number;
  extraActions?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{patient.name}</CardTitle>
        <CardDescription>
          Patient #{patient.patientNo} · Record ID <span className="font-mono text-xs select-all">{patient.id}</span>
        </CardDescription>
        <CardAction className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/patients/${patient.id}/edit`}>
              <Pencil /> Edit
            </Link>
          </Button>
          {extraActions}
        </CardAction>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <Info label="CNIC" value={patient.cnic} />
          <Info label="Mobile" value={patient.phone} />
          <Info label="Gender" value={patient.gender && patient.gender[0].toUpperCase() + patient.gender.slice(1)} />
          <Info label="Age" value={patient.age != null ? `${patient.age} years` : undefined} />
          <Info label="Address" value={patient.address} />
          <Info label="Total visits" value={String(totalVisits)} />
        </dl>
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium break-words">{value || "—"}</dd>
    </div>
  );
}
