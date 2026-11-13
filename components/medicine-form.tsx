"use client";

import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field, FormMessage, SubmitButton, useServerForm } from "@/components/form-bits";
import { MEDICINE_FORMS } from "@/lib/constants";
import type { FormState } from "@/lib/validation";
import type { MedicineDTO } from "@/lib/queries";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

/** Medicine details only. Batches are managed on the medicine's page. */
export function MedicineForm({ action, medicine, submitLabel }: { action: Action; medicine?: MedicineDTO; submitLabel: string }) {
  const { state, errors: e, onSubmit, pending } = useServerForm(action);

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <FormMessage message={state.message} />
      <Field label="Medicine name *" htmlFor="name" error={e.name}>
        <Input id="name" name="name" defaultValue={medicine?.name} placeholder="Nux Vomica" maxLength={100} required autoFocus />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Form *" htmlFor="form" error={e.form}>
          <NativeSelect id="form" name="form" defaultValue={medicine?.form ?? ""} required>
            <option value="" disabled>
              Choose…
            </option>
            {MEDICINE_FORMS.map((f) => (
              <option key={f} value={f}>
                {f[0].toUpperCase() + f.slice(1)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Manufacturer" htmlFor="manufacturer" error={e.manufacturer}>
          <Input id="manufacturer" name="manufacturer" defaultValue={medicine?.manufacturer} placeholder="Dr. Willmar Schwabe" />
        </Field>
      </div>
      <div>
        <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
