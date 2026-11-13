"use client";

import { useRef, useState } from "react";
import { History, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormMessage, SubmitButton, useServerForm } from "@/components/form-bits";
import { MedicineCombobox } from "@/components/medicine-combobox";
import { formatDate, toDateInput } from "@/lib/utils";
import type { FormState } from "@/lib/validation";
import type { MedicineOption, PreviousPrescription, PrescriptionItemDTO, VisitDTO } from "@/lib/queries";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;
type Row = PrescriptionItemDTO & { key: number }; // key = stable React key for add/remove

// Suggestions only: any potency can be typed (free text).
const POTENCIES = ["Q", "3X", "6X", "12X", "30X", "6C", "12C", "30C", "200C", "1M", "10M", "50M", "CM", "LM1", "LM2", "LM3", "LM6"];
const DOSES = ["4 pills", "2 pills", "2 tablets", "4 tablets", "2 drops", "5 drops", "10 drops in water", "1 teaspoon"];
const FREQUENCIES = ["Once daily (OD)", "Twice daily (BD)", "Thrice daily (TDS)", "Four times daily (QID)", "Every 2 hours", "Every 4 hours", "Weekly", "Single dose", "When needed (SOS)"];
const DURATIONS = ["1 day", "3 days", "5 days", "7 days", "10 days", "15 days", "1 month", "2 months"];

const blank = (): PrescriptionItemDTO => ({ medicineName: "", potency: "", dose: "", frequency: "", duration: "", instructions: "" });
const isBlank = (r: PrescriptionItemDTO) =>
  ![r.medicineName, r.potency, r.dose, r.frequency, r.duration, r.instructions].some((v) => v && v.trim());

export function VisitForm({
  action,
  visit,
  today,
  medicines,
  previous,
  submitLabel,
}: {
  action: Action;
  visit?: VisitDTO;
  today: string;
  medicines: MedicineOption[];
  previous: PreviousPrescription | null;
  submitLabel: string;
}) {
  const { state, errors: e, onSubmit, pending } = useServerForm(action);
  const nextKey = useRef(0);
  const withKey = (item: PrescriptionItemDTO): Row => ({ ...item, key: nextKey.current++ });

  const [rows, setRows] = useState<Row[]>(() => (visit?.prescription.items.length ? visit.prescription.items : [blank()]).map(withKey));
  const [generalInstructions, setGeneralInstructions] = useState(visit?.prescription.generalInstructions ?? "");

  const update = (key: number, patch: Partial<PrescriptionItemDTO>) =>
    setRows((list) => list.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const remove = (key: number) =>
    setRows((list) => (list.length === 1 ? [withKey(blank())] : list.filter((r) => r.key !== key)));

  const repeatLast = () => {
    if (!previous) return;
    const hasWork = rows.some((r) => !isBlank(r)) || generalInstructions.trim();
    if (hasWork && !confirm(`Replace the current prescription with the one from ${formatDate(previous.visitDate)}?`)) return;
    setRows(previous.items.map(withKey));
    setGeneralInstructions(previous.generalInstructions ?? "");
  };

  // Blank rows are ignored, so the starting empty row can be left alone.
  const items = rows.filter((r) => !isBlank(r)).map(({ key: _key, ...item }) => item);

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <FormMessage message={state.message} />
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Visit date *" htmlFor="visitDate" error={e.visitDate}>
          <Input id="visitDate" name="visitDate" type="date" defaultValue={visit ? toDateInput(visit.visitDate) : today} required />
        </Field>
        <Field label="Follow-up date" htmlFor="followUpDate" error={e.followUpDate}>
          <Input id="followUpDate" name="followUpDate" type="date" defaultValue={toDateInput(visit?.followUpDate)} />
        </Field>
      </div>

      <Field label="Complaints *" htmlFor="complaints" error={e.complaints}>
        <Textarea id="complaints" name="complaints" defaultValue={visit?.complaints} rows={2} required />
      </Field>
      <Field label="Notes (case taking, mentals, generals, modalities)" htmlFor="notes" error={e.notes}>
        <Textarea id="notes" name="notes" defaultValue={visit?.notes} rows={3} />
      </Field>

      <fieldset className="grid gap-3 rounded-lg border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <legend className="font-semibold">Prescription</legend>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={repeatLast}
              disabled={!previous}
              title={previous ? `Copy prescription from ${formatDate(previous.visitDate)}` : "No earlier prescription for this patient"}
            >
              <History /> Repeat last prescription
              {previous && <span className="text-muted-foreground text-xs">({formatDate(previous.visitDate)})</span>}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setRows((r) => [...r, withKey(blank())])}>
              <Plus /> Add medicine
            </Button>
          </div>
        </div>
        {e.prescription && <p className="text-destructive text-xs">{e.prescription[0]}</p>}

        {rows.map((row, i) => (
          <div key={row.key} className="grid gap-2 rounded-md bg-muted/40 p-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium">Medicine {i + 1}</span>
              <Button type="button" variant="ghost" size="sm" className="text-destructive h-7" onClick={() => remove(row.key)}>
                <Trash2 /> Remove
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
              <MedicineCombobox
                options={medicines}
                value={{ medicineId: row.medicineId, medicineName: row.medicineName }}
                onChange={(v) => update(row.key, v)}
                invalid={!!e.prescription && !row.medicineName}
              />
              <Input
                placeholder="Potency (30C, 200C, 1M, Q…)"
                aria-label="Potency"
                list="potencies"
                value={row.potency}
                onChange={(ev) => update(row.key, { potency: ev.target.value })}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Input placeholder="Dose" aria-label="Dose" list="doses" value={row.dose} onChange={(ev) => update(row.key, { dose: ev.target.value })} />
              <Input
                placeholder="Frequency"
                aria-label="Frequency"
                list="frequencies"
                value={row.frequency}
                onChange={(ev) => update(row.key, { frequency: ev.target.value })}
              />
              <Input
                placeholder="Duration"
                aria-label="Duration"
                list="durations"
                value={row.duration}
                onChange={(ev) => update(row.key, { duration: ev.target.value })}
              />
            </div>
            <Input
              placeholder="Instructions (e.g. dissolve under tongue, 30 min before food)"
              aria-label="Instructions"
              value={row.instructions ?? ""}
              onChange={(ev) => update(row.key, { instructions: ev.target.value })}
            />
          </div>
        ))}

        <Field label="General instructions" htmlFor="generalInstructions" error={e.generalInstructions}>
          <Textarea
            id="generalInstructions"
            name="generalInstructions"
            value={generalInstructions}
            onChange={(ev) => setGeneralInstructions(ev.target.value)}
            placeholder="e.g. Avoid coffee, mint and camphor. Keep a 30 min gap from food."
            rows={2}
          />
        </Field>

        <datalist id="potencies">{POTENCIES.map((n) => <option key={n} value={n} />)}</datalist>
        <datalist id="doses">{DOSES.map((n) => <option key={n} value={n} />)}</datalist>
        <datalist id="frequencies">{FREQUENCIES.map((n) => <option key={n} value={n} />)}</datalist>
        <datalist id="durations">{DURATIONS.map((n) => <option key={n} value={n} />)}</datalist>
      </fieldset>

      <div>
        <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
