import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportMenu } from "@/components/export-menu";
import { PatientList } from "@/components/patient-list";
import { listPatients } from "@/lib/queries";
import { param, type SearchParamValue } from "@/lib/utils";

export const metadata = { title: "Patients · MHP Clinic" };

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: SearchParamValue; q?: SearchParamValue }>;
}) {
  const sp = await searchParams;
  const q = param(sp.q);
  if (q) redirect(`/search?${new URLSearchParams({ q })}`); // old /patients?q= links
  const { patients, total, page, pages } = await listPatients(Number(param(sp.page)) || 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Patients</CardTitle>
        <CardDescription>
          {total} registered · newest first{pages > 1 && ` · page ${page} of ${pages}`}
        </CardDescription>
        <CardAction className="flex gap-2">
          <ExportMenu />
          <Button asChild size="sm">
            <Link href="/patients/new">
              <UserPlus /> <span className="hidden sm:inline">New patient</span>
              <span className="sm:hidden">New</span>
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4">
        <PatientList patients={patients} emptyText="No patients registered yet." />

        {pages > 1 && (
          <nav className="flex items-center justify-between gap-2" aria-label="Pagination">
            <Button asChild={page > 1} variant="outline" size="sm" disabled={page <= 1}>
              {page > 1 ? (
                <Link href={`/patients?page=${page - 1}`}>
                  <ChevronLeft /> Previous
                </Link>
              ) : (
                <span>
                  <ChevronLeft /> Previous
                </span>
              )}
            </Button>
            <span className="text-muted-foreground text-sm tabular-nums">
              {page} / {pages}
            </span>
            <Button asChild={page < pages} variant="outline" size="sm" disabled={page >= pages}>
              {page < pages ? (
                <Link href={`/patients?page=${page + 1}`}>
                  Next <ChevronRight />
                </Link>
              ) : (
                <span>
                  Next <ChevronRight />
                </span>
              )}
            </Button>
          </nav>
        )}
      </CardContent>
    </Card>
  );
}
