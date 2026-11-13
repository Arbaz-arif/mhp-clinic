import Link from "next/link";
import { ChevronRight, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PatientDTO } from "@/lib/queries";

const genderAge = (p: PatientDTO) => [p.gender, p.age != null ? `${p.age} y` : null].filter(Boolean).join(" · ");

/** Patients as a table on tablet/desktop and as tappable cards on phones. */
export function PatientList({ patients, emptyText = "No patients found." }: { patients: PatientDTO[]; emptyText?: string }) {
  if (patients.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground mb-3 text-sm">{emptyText}</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/patients/new">
            <UserPlus /> Register new patient
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Phones */}
      <ul className="divide-y rounded-lg border md:hidden">
        {patients.map((p) => (
          <li key={p.id}>
            <Link href={`/patients/${p.id}`} className="active:bg-accent flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {p.name} <span className="text-muted-foreground text-xs font-normal">#{p.patientNo}</span>
                </p>
                <p className="text-muted-foreground truncate text-sm">{[p.phone, p.cnic].filter(Boolean).join(" · ")}</p>
                {genderAge(p) && <p className="text-muted-foreground text-xs capitalize">{genderAge(p)}</p>}
              </div>
              <ChevronRight className="text-muted-foreground size-4 shrink-0" />
            </Link>
          </li>
        ))}
      </ul>

      {/* Tablet / desktop */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>CNIC</TableHead>
              <TableHead>Gender / Age</TableHead>
              <TableHead className="hidden xl:table-cell">Record ID</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-muted-foreground tabular-nums">{p.patientNo}</TableCell>
                <TableCell>
                  <Link href={`/patients/${p.id}`} className="font-medium hover:underline">
                    {p.name}
                  </Link>
                </TableCell>
                <TableCell>{p.phone ?? "—"}</TableCell>
                <TableCell>{p.cnic ?? "—"}</TableCell>
                <TableCell className="capitalize">{genderAge(p) || "—"}</TableCell>
                <TableCell className="text-muted-foreground hidden font-mono text-xs xl:table-cell">{p.id}</TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/patients/${p.id}`} aria-label={`Open ${p.name}`}>
                      Open <ChevronRight />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
