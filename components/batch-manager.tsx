"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Pencil, Plus, X } from "lucide-react";
import { addBatch, deleteBatch, updateBatch } from "@/app/actions/medicines";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDeleteButton, FormMessage, useServerForm } from "@/components/form-bits";
import { ExpiryBadge } from "@/components/expiry-badge";
import { formatDate, toDateInput } from "@/lib/utils";
import type { BatchDTO } from "@/lib/queries";

/**
 * Batches of one medicine. Each row is its own small form:
 *   add → $push · edit → positional $set · delete → $pull
 * Inputs sit in table cells and join their <form> through the `form` attribute.
 */
export function BatchManager({ medicineId, batches }: { medicineId: string; batches: BatchDTO[] }) {
  const total = batches.reduce((sum, b) => sum + b.quantity, 0);

  return (
    <div className="grid gap-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Batch number</TableHead>
            <TableHead>Expiry date</TableHead>
            <TableHead className="w-28">Quantity</TableHead>
            <TableHead>Purchase date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((b) => (
            <BatchRow key={b.id} medicineId={medicineId} batch={b} />
          ))}
          {batches.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground py-4 text-center">
                No batches yet. Add the first one below.
              </TableCell>
            </TableRow>
          )}
          <AddBatchRow medicineId={medicineId} />
        </TableBody>
      </Table>
      <p className="text-muted-foreground text-right text-sm">
        {batches.length} batch{batches.length === 1 ? "" : "es"} · total quantity <strong>{total}</strong>
      </p>
    </div>
  );
}

function BatchRow({ medicineId, batch }: { medicineId: string; batch: BatchDTO }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <TableRow className={batch.quantity === 0 ? "text-muted-foreground" : undefined}>
        <TableCell className="font-medium">{batch.batchNumber}</TableCell>
        <TableCell>
          <span className="flex items-center gap-2">
            {formatDate(batch.expiryDate)} <ExpiryBadge expiryDate={batch.expiryDate} />
          </span>
        </TableCell>
        <TableCell>{batch.quantity}</TableCell>
        <TableCell>{formatDate(batch.purchaseDate)}</TableCell>
        <TableCell>
          <div className="flex justify-end gap-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil /> Edit
            </Button>
            <ConfirmDeleteButton
              action={deleteBatch.bind(null, medicineId, batch.id)}
              confirmText={`Delete batch ${batch.batchNumber}?`}
            />
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <BatchFormRow
      formId={`batch-${batch.id}`}
      action={updateBatch.bind(null, medicineId, batch.id)}
      batch={batch}
      onSaved={() => setEditing(false)}
      actions={
        <>
          <SaveButton label="Save" />
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
            <X /> Cancel
          </Button>
        </>
      }
    />
  );
}

function AddBatchRow({ medicineId }: { medicineId: string }) {
  return (
    <BatchFormRow
      formId="add-batch"
      action={addBatch.bind(null, medicineId)}
      resetOnSave
      className="bg-muted/40 hover:bg-muted/40"
      actions={<SaveButton label="Add batch" icon="add" />}
    />
  );
}

type BatchAction = Parameters<typeof useServerForm>[0];

function BatchFormRow({
  formId,
  action,
  batch,
  onSaved,
  resetOnSave,
  actions,
  className,
}: {
  formId: string;
  action: BatchAction;
  batch?: BatchDTO;
  onSaved?: () => void;
  resetOnSave?: boolean;
  actions: React.ReactNode;
  className?: string;
}) {
  const { state, errors: e, onSubmit, pending } = useServerForm(action);
  const formRef = useRef<HTMLFormElement>(null);

  // After a successful save: close the editor, or clear the "add" row for the next batch.
  useEffect(() => {
    if (!state.ok) return;
    if (resetOnSave) {
      formRef.current?.reset();
      formRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    }
    onSaved?.();
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <TableRow className={className}>
      <TableCell className="align-top">
        <Input form={formId} name="batchNumber" defaultValue={batch?.batchNumber} placeholder="Batch no." aria-label="Batch number" aria-invalid={!!e.batchNumber} required autoFocus={!!batch} />
        <FieldError messages={e.batchNumber} />
      </TableCell>
      <TableCell className="align-top">
        <Input form={formId} name="expiryDate" type="date" defaultValue={toDateInput(batch?.expiryDate)} aria-label="Expiry date" aria-invalid={!!e.expiryDate} required />
        <FieldError messages={e.expiryDate} />
      </TableCell>
      <TableCell className="align-top">
        <Input form={formId} name="quantity" type="number" min={0} step={1} defaultValue={batch?.quantity} placeholder="Qty" aria-label="Quantity" aria-invalid={!!e.quantity} required />
        <FieldError messages={e.quantity} />
      </TableCell>
      <TableCell className="align-top">
        <Input form={formId} name="purchaseDate" type="date" defaultValue={toDateInput(batch?.purchaseDate)} aria-label="Purchase date" aria-invalid={!!e.purchaseDate} />
        <FieldError messages={e.purchaseDate} />
      </TableCell>
      <TableCell className="align-top">
        <form id={formId} ref={formRef} onSubmit={onSubmit} className="flex justify-end gap-1">
          <fieldset disabled={pending} className="contents">
            {actions}
          </fieldset>
        </form>
        <FormMessage message={state.message} />
      </TableCell>
    </TableRow>
  );
}

function SaveButton({ label, icon }: { label: string; icon?: "add" }) {
  return (
    <Button type="submit" size="sm">
      {icon === "add" ? <Plus /> : <Check />} {label}
    </Button>
  );
}

function FieldError({ messages }: { messages?: string[] }) {
  return messages?.length ? <p className="text-destructive mt-1 text-xs whitespace-normal">{messages[0]}</p> : null;
}
