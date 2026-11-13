import { notFound } from "next/navigation";
import { PrintToolbar } from "@/components/print-toolbar";
import { clinicInfo } from "@/lib/clinic";
import { getPatient, getVisit } from "@/lib/queries";
import { requireAdmin } from "@/lib/session";
import { formatDate, param, type SearchParamValue } from "@/lib/utils";

// Lives in the (print) route group: no app navigation, just the A5 sheet.
export const dynamic = "force-dynamic";
export const metadata = { title: "Prescription", robots: { index: false } };

// Page size for the browser's print dialog. Only this page sets A5.
const PRINT_CSS = `
  @page { size: A5 portrait; margin: 0; }
  @media print {
    html, body { background: #fff !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

export default async function PrintPrescriptionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ auto?: SearchParamValue }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const auto = param((await searchParams).auto);
  const visit = await getVisit(id);
  if (!visit) notFound();
  const patient = await getPatient(visit.patientId);
  const clinic = clinicInfo();
  const { items, generalInstructions } = visit.prescription;

  return (
    <div className="min-h-screen bg-neutral-200 pb-8 print:bg-white print:p-0">
      <style>{PRINT_CSS}</style>
      <PrintToolbar backHref={`/visits/${id}`} autoPrint={auto === "1"} />

      {/* A5 = 148 × 210 mm. Same size on screen and paper. */}
      <article className="mx-auto flex min-h-[209mm] w-[148mm] max-w-full flex-col bg-white p-[10mm] text-[10.5pt] leading-snug text-neutral-900 shadow-lg print:shadow-none">
        {/* Letterhead */}
        <header className="flex items-start gap-3 border-b-2 border-neutral-800 pb-3">
          {clinic.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={clinic.logoUrl} alt="" className="size-[16mm] object-contain" />
          ) : (
            <div className="flex size-[16mm] shrink-0 items-center justify-center rounded-full border-2 border-dashed border-neutral-400 text-[7pt] text-neutral-500">
              LOGO
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-[15pt] leading-tight font-bold">{clinic.name}</h1>
            <p className="text-[9pt] text-neutral-600">{clinic.tagline}</p>
            <p className="text-[8.5pt] text-neutral-600">
              {clinic.address}
              {clinic.phone && ` · ${clinic.phone}`}
            </p>
          </div>
          <div className="text-right text-[9pt]">
            <p className="font-semibold">{clinic.doctorName}</p>
            <p className="text-neutral-600">{clinic.doctorQualifications}</p>
            {clinic.doctorRegNo && <p className="text-neutral-600">Reg. {clinic.doctorRegNo}</p>}
          </div>
        </header>

        {/* Patient */}
        <section className="grid grid-cols-[auto_1fr_auto_auto] gap-x-2 gap-y-1 border-b border-neutral-300 py-2 text-[9.5pt]">
          <span className="text-neutral-500">Patient</span>
          <span className="font-semibold">{patient?.name ?? "—"}</span>
          <span className="text-neutral-500">Date</span>
          <span className="font-semibold">{formatDate(visit.visitDate)}</span>

          <span className="text-neutral-500">{patient?.cnic ? "CNIC" : "Mobile"}</span>
          <span>{patient?.cnic ?? patient?.phone ?? "—"}</span>
          <span className="text-neutral-500">Patient #</span>
          <span>{patient?.patientNo ?? "—"}</span>

          {patient?.cnic && patient.phone && (
            <>
              <span className="text-neutral-500">Mobile</span>
              <span>{patient.phone}</span>
            </>
          )}
          {(patient?.age != null || patient?.gender) && (
            <>
              <span className="text-neutral-500">Age/Sex</span>
              <span className="capitalize">
                {[patient?.age != null ? `${patient.age} y` : null, patient?.gender].filter(Boolean).join(" / ")}
              </span>
            </>
          )}
        </section>

        {/* Complaints */}
        <p className="pt-2 text-[9pt]">
          <span className="font-semibold">C/O: </span>
          {visit.complaints}
        </p>

        {/* Medicines */}
        <section className="pt-3">
          <p className="font-serif text-[20pt] leading-none font-bold" aria-label="Prescription">
            ℞
          </p>
          {items.length === 0 ? (
            <p className="pt-2 text-neutral-500">No medicines prescribed.</p>
          ) : (
            <ol className="grid gap-2.5 pt-2">
              {items.map((item, i) => (
                <li key={i} className="grid grid-cols-[5mm_1fr] break-inside-avoid">
                  <span className="font-semibold">{i + 1}.</span>
                  <div>
                    <p>
                      <span className="font-semibold">{item.medicineName}</span>{" "}
                      <span className="font-semibold">{item.potency}</span>
                    </p>
                    <p className="text-[9.5pt]">
                      {item.dose} · {item.frequency} · for {item.duration}
                    </p>
                    {item.instructions && <p className="text-[9pt] text-neutral-600 italic">{item.instructions}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {generalInstructions && (
          <section className="mt-4 rounded border border-neutral-300 p-2 text-[9pt] break-inside-avoid">
            <p className="font-semibold">Instructions</p>
            <p className="whitespace-pre-wrap">{generalInstructions}</p>
          </section>
        )}

        {visit.followUpDate && (
          <p className="mt-3 text-[9.5pt]">
            <span className="font-semibold">Next visit:</span> {formatDate(visit.followUpDate)}
          </p>
        )}

        {/* Signature, pushed to the bottom of the sheet */}
        <footer className="mt-auto flex items-end justify-between pt-10 break-inside-avoid">
          <p className="max-w-[60%] text-[7.5pt] text-neutral-500">
            Keep medicines away from strong smells (camphor, mint, perfume). Do not touch pills by hand.
          </p>
          <div className="w-[48mm] text-center text-[9pt]">
            <div className="border-t border-neutral-800 pt-1">Doctor&apos;s signature</div>
            <p className="text-[8pt] text-neutral-600">{clinic.doctorName}</p>
          </div>
        </footer>
      </article>
    </div>
  );
}
