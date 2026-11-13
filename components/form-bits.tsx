"use client";

import { startTransition, useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/validation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string[];
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error?.length ? (
        <p className="text-destructive text-xs">{error[0]}</p>
      ) : hint ? (
        <p className="text-muted-foreground text-xs">{hint}</p>
      ) : null}
    </div>
  );
}

export function FormMessage({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">{message}</p>;
}

type ServerAction = (prev: FormState, formData: FormData) => Promise<FormState>;

/**
 * Runs a server action without React's automatic form reset, so typed values
 * survive a validation error.
 */
export function useServerForm(action: ServerAction) {
  const [state, formAction, pending] = useActionState(action, {});
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => formAction(formData));
  };
  return { state, errors: state.errors ?? {}, onSubmit, pending };
}

export function SubmitButton({
  children,
  pending,
  className,
}: {
  children: React.ReactNode;
  pending: boolean;
  className?: string;
}) {
  return (
    <Button type="submit" disabled={pending} className={className}>
      {pending && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}

/** A form that runs a server action after a browser confirm(). */
export function ConfirmDeleteButton({
  action,
  confirmText,
  children = "Delete",
}: {
  action: () => Promise<void>;
  confirmText: string;
  children?: React.ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      <DeleteSubmit>{children}</DeleteSubmit>
    </form>
  );
}

function DeleteSubmit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending} className="text-destructive">
      {pending && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}
