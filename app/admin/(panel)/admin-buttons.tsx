"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AdminResult } from "@/lib/admin";
import { PAYMENT_METHODS, type PaymentInput, type PaymentMethod } from "@/lib/payment-options";
import { removeListingAction } from "./actions";
import { dangerButtonClass, fieldClass, primaryButtonClass, secondaryButtonClass } from "./ui";

const TONE_CLASS = {
  primary: primaryButtonClass,
  default: secondaryButtonClass,
  danger: dangerButtonClass,
} as const;

type Tone = keyof typeof TONE_CLASS;

function useAdminAction() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function run(action: () => Promise<AdminResult>, after?: () => void, success?: string) {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        if (success) toast.success(success);
        after?.();
      }
    });
  }

  return { pending, error, run };
}

function ErrorText({ error }: { error?: string }) {
  return error ? <span className="text-sm text-red-600 dark:text-red-400">{error}</span> : null;
}

// Asks before running a one-click action that's hard to undo.
function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  tone,
  pending,
  onConfirm,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  tone: Tone;
  pending: boolean;
  onConfirm: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onConfirm();
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {children}
          <DialogFooter>
            <button type="button" onClick={() => onOpenChange(false)} className={secondaryButtonClass}>
              Cancel
            </button>
            <button type="submit" disabled={pending} className={TONE_CLASS[tone]}>
              {pending ? "Working…" : confirmLabel}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// `action` is a server action bound to its target id by the server page.
// With `confirm`, the admin is asked first.
export function AdminActionButton({
  label,
  action,
  tone = "default",
  success,
  confirm,
}: {
  label: string;
  action: () => Promise<AdminResult>;
  tone?: Tone;
  success?: string;
  confirm?: { title: string; description: string };
}) {
  const { pending, error, run } = useAdminAction();
  const [open, setOpen] = useState(false);

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => (confirm ? setOpen(true) : run(action, undefined, success))}
        className={TONE_CLASS[tone]}
      >
        {pending ? "Working…" : label}
      </button>
      {!confirm && <ErrorText error={error} />}
      {confirm && (
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title={confirm.title}
          description={confirm.description}
          confirmLabel={label}
          tone={tone}
          pending={pending}
          onConfirm={() => run(action, () => setOpen(false), success)}
        >
          <ErrorText error={error} />
        </ConfirmDialog>
      )}
    </span>
  );
}

// Asks for the reason the seller will see before running a negative action
// (remove a listing, reject an ID). `action` is bound to its target id.
export function ReasonActionButton({
  label,
  action,
  title = `${label}?`,
  description = "The seller sees this reason.",
  success,
}: {
  label: string;
  action: (reason: string) => Promise<AdminResult>;
  title?: string;
  description?: string;
  success?: string;
}) {
  const { pending, error, run } = useAdminAction();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={dangerButtonClass}>
        {label}
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        confirmLabel={label}
        tone="danger"
        pending={pending}
        onConfirm={() =>
          run(
            () => action(reason),
            () => {
              setOpen(false);
              setReason("");
            },
            success,
          )
        }
      >
        <textarea
          autoFocus
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={300}
          required
          rows={3}
          placeholder="Reason shown to seller"
          aria-label="Reason shown to seller"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <ErrorText error={error} />
      </ConfirmDialog>
    </>
  );
}

// `autoHidden`: the listing is already hidden by reports; this confirms it.
export function RemoveListingButton({ listingId, autoHidden = false }: { listingId: string; autoHidden?: boolean }) {
  return (
    <ReasonActionButton
      label={autoHidden ? "Keep removed" : "Remove listing"}
      title={autoHidden ? "Keep this listing removed?" : "Remove this listing?"}
      description={
        autoHidden
          ? "It stays hidden and its open reports are closed. The seller sees your reason instead of the automatic one."
          : "It disappears from search and its open reports are closed. The seller sees your reason."
      }
      success="Listing removed"
      action={removeListingAction.bind(null, listingId)}
    />
  );
}

type Option = { value: string; label: string };

// Plan durations travel as strings ("" = no expiry) because <select> values do.
function durationMonths(value: string): number | null {
  return value === "" ? null : Number(value);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

// Optional payment recorded with a plan change. The amount follows the plan
// price × months until the admin types their own.
function usePayment(suggestedAmount: number) {
  const [record, setRecord] = useState(false);
  const [amount, setAmount] = useState<string>();
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer");
  const [reference, setReference] = useState("");

  return {
    fields: {
      record,
      setRecord,
      amount: amount ?? String(suggestedAmount),
      setAmount,
      method,
      setMethod,
      reference,
      setReference,
    },
    // Call when the plan or duration changes so the suggestion applies again.
    resetAmount: () => setAmount(undefined),
    reset: () => {
      setRecord(false);
      setAmount(undefined);
      setReference("");
    },
    value: (): PaymentInput | null =>
      record ? { amount: Number(amount ?? suggestedAmount), method, reference } : null,
  };
}

function PaymentFields({
  fields,
  pending,
}: {
  fields: ReturnType<typeof usePayment>["fields"];
  pending: boolean;
}) {
  return (
    <div className="rounded-lg border border-line bg-canvas/60 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={fields.record}
          disabled={pending}
          onChange={(event) => fields.setRecord(event.target.checked)}
          className="size-4 accent-brand"
        />
        Record a payment with this change
      </label>
      {fields.record && (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label="Amount (SAR)">
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={fields.amount}
              disabled={pending}
              onChange={(event) => fields.setAmount(event.target.value)}
              className={fieldClass}
            />
          </Field>
          <Field label="Method">
            <select
              value={fields.method}
              disabled={pending}
              onChange={(event) => fields.setMethod(event.target.value as PaymentMethod)}
              className={fieldClass}
            >
              {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Reference (optional)">
            <input
              value={fields.reference}
              disabled={pending}
              onChange={(event) => fields.setReference(event.target.value)}
              maxLength={100}
              className={fieldClass}
            />
          </Field>
        </div>
      )}
    </div>
  );
}

// Monthly price × months; "no expiry" suggests one month.
function suggestedPrice(prices: Record<string, number>, plan: string, duration: string): number {
  return Math.round((prices[plan] ?? 0) * (durationMonths(duration) ?? 1) * 100) / 100;
}

// Grants a plan for a duration, with an optional note for the plan history
// and an optional payment. Picking the current plan again renews it from today.
export function PlanSelect({
  plan,
  plans,
  durations,
  prices,
  action,
}: {
  plan: string;
  plans: Option[];
  durations: Option[];
  prices: Record<string, number>;
  action: (
    plan: string,
    months: number | null,
    note: string,
    payment: PaymentInput | null,
  ) => Promise<AdminResult>;
}) {
  const { pending, error, run } = useAdminAction();
  const [value, setValue] = useState(plan);
  const [duration, setDuration] = useState(durations[0]?.value ?? "");
  const [note, setNote] = useState("");
  const payment = usePayment(suggestedPrice(prices, value, duration));

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        run(
          () => action(value, durationMonths(duration), note, value === "free" ? null : payment.value()),
          () => {
            setNote("");
            payment.reset();
          },
          "Plan saved",
        );
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Plan">
          <select
            value={value}
            disabled={pending}
            onChange={(event) => {
              setValue(event.target.value);
              payment.resetAmount();
            }}
            className={fieldClass}
          >
            {plans.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        {value !== "free" && (
          <Field label="Duration">
            <select
              value={duration}
              disabled={pending}
              onChange={(event) => {
                setDuration(event.target.value);
                payment.resetAmount();
              }}
              className={fieldClass}
            >
              {durations.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>
      <Field label="Note for the plan history (optional)">
        <input
          value={note}
          disabled={pending}
          onChange={(event) => setNote(event.target.value)}
          maxLength={300}
          className={fieldClass}
        />
      </Field>
      {value !== "free" && <PaymentFields fields={payment.fields} pending={pending} />}
      <div className="flex items-center justify-end gap-3">
        <ErrorText error={error} />
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Saving…" : "Save plan"}
        </button>
      </div>
    </form>
  );
}

// Adds months on top of the user's current expiry, keeping their plan.
export function ExtendPlanForm({
  plan,
  durations,
  prices,
  action,
}: {
  plan: string;
  durations: Option[];
  prices: Record<string, number>;
  action: (months: number, note: string, payment: PaymentInput | null) => Promise<AdminResult>;
}) {
  const { pending, error, run } = useAdminAction();
  const [open, setOpen] = useState(false);
  const [duration, setDuration] = useState(durations[0]?.value ?? "1");
  const [note, setNote] = useState("");
  const payment = usePayment(suggestedPrice(prices, plan, duration));

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={primaryButtonClass}>
        Extend plan
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              run(
                () => action(Number(duration), note, payment.value()),
                () => {
                  setNote("");
                  payment.reset();
                  setOpen(false);
                },
                "Plan extended",
              );
            }}
          >
            <DialogHeader>
              <DialogTitle>Extend plan</DialogTitle>
              <DialogDescription>The months are added on top of the current end date.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Extend by">
                <select
                  value={duration}
                  disabled={pending}
                  onChange={(event) => {
                    setDuration(event.target.value);
                    payment.resetAmount();
                  }}
                  className={fieldClass}
                >
                  {durations.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Note (optional)">
                <input
                  value={note}
                  disabled={pending}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={300}
                  className={fieldClass}
                />
              </Field>
            </div>
            <PaymentFields fields={payment.fields} pending={pending} />
            <ErrorText error={error} />
            <DialogFooter>
              <button type="button" onClick={() => setOpen(false)} className={secondaryButtonClass}>
                Cancel
              </button>
              <button type="submit" disabled={pending} className={primaryButtonClass}>
                {pending ? "Extending…" : "Extend plan"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Approves a dealer application on the chosen plan (defaults to the one asked for).
export function ApproveDealerButton({
  plan,
  plans,
  durations,
  action,
}: {
  plan: string;
  plans: Option[];
  durations: Option[];
  action: (plan: string, months: number | null) => Promise<AdminResult>;
}) {
  const { pending, error, run } = useAdminAction();
  const [value, setValue] = useState(plan);
  const [duration, setDuration] = useState(durations[0]?.value ?? "");

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto">
      <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-end">
        <Field label="Plan to grant">
          <select value={value} disabled={pending} onChange={(event) => setValue(event.target.value)} className={fieldClass}>
            {plans.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Duration">
          <select
            value={duration}
            disabled={pending}
            onChange={(event) => setDuration(event.target.value)}
            className={fieldClass}
          >
            {durations.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => action(value, durationMonths(duration)), undefined, "Dealer approved")}
          className={primaryButtonClass}
        >
          {pending ? "Approving…" : "Approve dealer"}
        </button>
      </div>
      <ErrorText error={error} />
    </div>
  );
}
