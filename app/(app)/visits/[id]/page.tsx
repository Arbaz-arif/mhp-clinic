import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDeleteButton } from "@/components/form-bits";
import { deleteVisit } from "@/app/actions/visits";
import { getPatient, getVisit } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export default async function VisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const visit = await getVisit(id);
  if (!visit) notFound();
  const patient = await getPatient(visit.patientId);
  const { items, generalInstructions } = visit.prescription;

  return (
    <div className="grid gap-4">
      {patient && (
        <Link
          href={`/patients/${patient.id}`}
          className="text-muted-foreground flex w-fit items-center gap-1 text-sm hover:underline"
        >
          <ArrowLeft className="size-4" /> {patient.name} · #{patient.patientNo}
        </Link>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Visit on {formatDate(visit.visitDate)}</CardTitle>
          <CardDescription>
            {patient ? `${patient.name}${patient.age != null ? `, ${patient.age} y` : ""}` : "Unknown patient"}
            {visit.followUpDate ? ` · Follow-up ${formatDate(visit.followUpDate)}` : " · No follow-up set"}
          </CardDescription>
          <CardAction className="flex gap-2">
            <Button asChild size="sm">
              <Link href={`/visits/${id}/print?auto=1`} target="_blank">
                <Printer /> Print
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/visits/${id}/edit`}>
                <Pencil /> Edit
              </Link>
            </Button>
            <ConfirmDeleteButton action={deleteVisit.bind(null, id)} confirmText="Delete this visit and its prescription?" />
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-5 text-sm">
          <Section title="Complaints">
            <p className="whitespace-pre-wrap">{visit.complaints}</p>
          </Section>
          {visit.notes && (
            <Section title="Notes">
              <p className="whitespace-pre-wrap">{visit.notes}</p>
            </Section>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prescription</CardTitle>
          <CardDescription>
            {items.length} medicine{items.length === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm">
          {items.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Potency</TableHead>
                    <TableHead>Dose</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>How to take</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {item.medicineId ? (
                          <Link href={`/medicines/${item.medicineId}`} className="hover:underline">
                            {item.medicineName}
                          </Link>
                        ) : (
                          item.medicineName
                        )}
                      </TableCell>
                      <TableCell>{item.potency}</TableCell>
                      <TableCell>{item.dose}</TableCell>
                      <TableCell>{item.frequency}</TableCell>
                      <TableCell>{item.duration}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-normal">{item.instructions ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground">No medicines prescribed.</p>
          )}
          {generalInstructions && (
            <Section title="General instructions">
              <p className="whitespace-pre-wrap">{generalInstructions}</p>
            </Section>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{title}</h3>
      {children}
    </div>
  );
}
