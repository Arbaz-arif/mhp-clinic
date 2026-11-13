import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientList } from "@/components/patient-list";
import { connectDB } from "@/lib/db";
import { SEARCH_LIMIT, searchPatients } from "@/lib/queries";
import { param, type SearchParamValue } from "@/lib/utils";
import { parseIdentifier } from "@/lib/validation";
import { Patient } from "@/models/Patient";

export const metadata = { title: "Search · MHP Clinic" };

/**
 * Results for the top-bar search (the app's only search box):
 *  - a full CNIC / mobile that belongs to a patient → straight to their profile
 *  - a full CNIC / mobile nobody has → "Register new patient" with it prefilled
 *  - anything else → all matching patients
 */
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: SearchParamValue }> }) {
  const q = param((await searchParams).q).trim().slice(0, 100);

  if (!q) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-center text-sm">
          <Search className="size-6 opacity-50" aria-hidden />
          Type a name, mobile number or CNIC in the search bar at the top and press Enter.
        </CardContent>
      </Card>
    );
  }

  // Exact CNIC / mobile → open the profile directly.
  const ident = parseIdentifier(q);
  if (ident) {
    await connectDB();
    const match = await Patient.findOne(ident, { _id: 1 }).lean();
    if (match) redirect(`/patients/${match._id}`);
  }

  const patients = await searchPatients(q);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Search results</CardTitle>
        <CardDescription aria-live="polite">
          {patients.length} patient{patients.length === 1 ? "" : "s"} matching “{q}”
          {patients.length === SEARCH_LIMIT && ` (first ${SEARCH_LIMIT}, refine your search)`}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {ident && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed p-4">
            <p className="text-sm">
              No patient is registered with {ident.cnic ? "CNIC" : "mobile number"}{" "}
              <strong>{ident.cnic ?? ident.phone}</strong>.
            </p>
            <Button asChild>
              <Link href={`/patients/new?${new URLSearchParams(ident as Record<string, string>)}`}>
                <UserPlus /> Register new patient
              </Link>
            </Button>
          </div>
        )}
        {(!ident || patients.length > 0) && (
          <PatientList patients={patients} emptyText={`No patient matches “${q}”.`} />
        )}
      </CardContent>
    </Card>
  );
}
