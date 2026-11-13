"use client";

import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field, FormMessage, SubmitButton, useServerForm } from "@/components/form-bits";
import type { FormState } from "@/lib/validation";
import type { PatientDTO } from "@/lib/queries";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

/** Insert CNIC dashes as the doctor types: 3520112345671 → 35201-1234567-1. */
function formatCnic(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 13);
  if (d.length <= 5) return d;
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

export function PatientForm({
  action,
  patient,
  defaults,
  submitLabel,
}: {
  action: Action;
  patient?: PatientDTO;
  defaults?: { cnic?: string; phone?: string };
  submitLabel: string;
}) {
  const { state, errors: e, onSubmit, pending } = useServerForm(action);

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <FormMessage message={state.message} />
      <Field label="Full name *" htmlFor="name" error={e.name}>
        <Input id="name" name="name" defaultValue={patient?.name} maxLength={100} aria-invalid={!!e.name} required />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="CNIC" htmlFor="cnic" error={e.cnic} hint="12345-1234567-1">
          <Input
            id="cnic"
            name="cnic"
            defaultValue={patient?.cnic ?? defaults?.cnic}
            placeholder="12345-1234567-1"
            inputMode="numeric"
            maxLength={15}
            aria-invalid={!!e.cnic}
            onInput={(ev) => (ev.currentTarget.value = formatCnic(ev.currentTarget.value))}
          />
        </Field>
        <Field label="Mobile number" htmlFor="phone" error={e.phone} hint="03XXXXXXXXX — CNIC or mobile is required">
          <Input
            id="phone"
            name="phone"
            defaultValue={patient?.phone ?? defaults?.phone}
            placeholder="03001234567"
            inputMode="tel"
            maxLength={16}
            aria-invalid={!!e.phone}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Gender" htmlFor="gender" error={e.gender}>
          <NativeSelect id="gender" name="gender" defaultValue={patient?.gender ?? ""}>
            <option value="">—</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </NativeSelect>
        </Field>
        <Field label="Age (years)" htmlFor="age" error={e.age}>
          <Input id="age" name="age" type="number" min={0} max={130} step={1} defaultValue={patient?.age} />
        </Field>
      </div>

      <Field label="Address" htmlFor="address" error={e.address}>
        <Input id="address" name="address" defaultValue={patient?.address} />
      </Field>

      <div>
        <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
