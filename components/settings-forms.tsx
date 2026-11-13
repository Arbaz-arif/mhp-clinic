"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field, FormMessage, SubmitButton, useServerForm } from "@/components/form-bits";
import { updateEmail, updatePassword, updateProfile } from "@/app/actions/settings";
import { PASSWORD_MIN, type FormState } from "@/lib/validation";

function Success({ state }: { state: FormState }) {
  if (!state.ok || !state.message) return null;
  return (
    <p role="status" className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
      <CheckCircle2 className="size-4 shrink-0" aria-hidden /> {state.message}
    </p>
  );
}

/** Clear secret fields after a successful save. */
function useResetOnSuccess(state: FormState) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return ref;
}

export function ProfileForm({ name }: { name?: string }) {
  const { state, errors: e, onSubmit, pending } = useServerForm(updateProfile);
  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <Success state={state} />
      <FormMessage message={state.ok ? undefined : state.message} />
      <Field label="Your name" htmlFor="name" error={e.name} hint='Shown in the sidebar and greeting, e.g. "Dr. Akram Bhatti".'>
        <Input id="name" name="name" defaultValue={name} maxLength={100} autoComplete="name" placeholder="Dr. Akram Bhatti" />
      </Field>
      <div>
        <SubmitButton pending={pending}>Save name</SubmitButton>
      </div>
    </form>
  );
}

export function EmailForm({ email }: { email: string }) {
  const { state, errors: e, onSubmit, pending } = useServerForm(updateEmail);
  const ref = useResetOnSuccess(state);
  return (
    <form ref={ref} onSubmit={onSubmit} className="grid gap-4">
      <Success state={state} />
      <p className="text-muted-foreground text-sm">
        Currently <span className="text-foreground font-medium">{email}</span>
      </p>
      <Field label="New email" htmlFor="email" error={e.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </Field>
      <Field label="Current password" htmlFor="email-current" error={e.currentPassword} hint="Needed to confirm it's you.">
        <Input id="email-current" name="currentPassword" type="password" autoComplete="current-password" required />
      </Field>
      <div>
        <SubmitButton pending={pending}>Change email</SubmitButton>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const { state, errors: e, onSubmit, pending } = useServerForm(updatePassword);
  const ref = useResetOnSuccess(state);
  return (
    <form ref={ref} onSubmit={onSubmit} className="grid gap-4">
      <Success state={state} />
      <Field label="Current password" htmlFor="pw-current" error={e.currentPassword}>
        <Input id="pw-current" name="currentPassword" type="password" autoComplete="current-password" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New password" htmlFor="pw-new" error={e.newPassword} hint={`At least ${PASSWORD_MIN} characters.`}>
          <Input id="pw-new" name="newPassword" type="password" autoComplete="new-password" minLength={PASSWORD_MIN} maxLength={72} required />
        </Field>
        <Field label="Confirm new password" htmlFor="pw-confirm" error={e.confirmPassword}>
          <Input id="pw-confirm" name="confirmPassword" type="password" autoComplete="new-password" required />
        </Field>
      </div>
      <div>
        <SubmitButton pending={pending}>Change password</SubmitButton>
      </div>
    </form>
  );
}
