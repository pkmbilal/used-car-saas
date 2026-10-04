"use client";

import { useState, useTransition } from "react";
import type { AdminResult } from "@/lib/admin";
import { PAYMENT_METHODS, type PaymentInput, type PaymentMethod } from "@/lib/payment-options";
import { removeListingAction } from "./actions";

const buttonClass = "text-sm font-medium underline-offset-4 hover:underline disabled:opacity-50";

function useAdminAction() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function run(action: () => Promise<AdminResult>, after?: () => void) {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      else after?.();
    });
  }

  return { pending, error, run };
}

// `action` is a server action bound to its target id by the server page.
export function AdminActionButton({
  label,
  action,
  tone = "default",
}: {
  label: string;
  action: () => Promise<AdminResult>;
  tone?: "default" | "danger";
}) {
  const { pending, error, run } = useAdminAction();
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => run(action)}
        className={`${buttonClass} ${tone === "danger" ? "text-red-600" : ""}`}
      >
        {label}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </span>
  );
}

// Asks for the reason the seller will see before running a negative action
// (remove a listing, reject an ID). `action` is bound to its target id.
export function ReasonActionButton({
  label,
  action,
}: {
  label: string;
  action: (reason: string) => Promise<AdminResult>;
}) {
  const { pending, error, run } = useAdminAction();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${buttonClass} text-red-600`}>
        {label}
      </button>
    );
  }

  return (
    <form
      className="flex flex-col items-end gap-1"
      onSubmit={(event) => {
        event.preventDefault();
        run(() => action(reason), () => setOpen(false));
      }}
    >
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={300}
          required
          placeholder="Reason shown to seller"
          aria-label="Reason shown to seller"
          className="w-56 rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button type="submit" disabled={pending} className={`${buttonClass} text-red-600`}>
          Confirm
        </button>
        <button type="button" onClick={() => setOpen(false)} className={buttonClass}>
          Cancel
        </button>
      </div>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </form>
  );
}

export function RemoveListingButton({ listingId }: { listingId: string }) {
  return <ReasonActionButton label="Remove" action={removeListingAction.bind(null, listingId)} />;
}

type Option = { value: string; label: string };

// Plan durations travel as strings ("" = no expiry) because <select> values do.
function durationMonths(value: string): number | null {
  return value === "" ? null : Number(value);
}

const selectClass =
  "rounded-md border border-zinc-300 px-2 py-1 text-sm disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900";

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
    <span className="flex flex-wrap items-center justify-end gap-2">
      <label className="flex items-center gap-1 text-sm">
        <input
          type="checkbox"
          checked={fields.record}
          disabled={pending}
          onChange={(event) => fields.setRecord(event.target.checked)}
        />
        Record payment
      </label>
      {fields.record && (
        <>
          <input
            type="number"
            min="0.01"
            step="0.01"
            required
            value={fields.amount}
            disabled={pending}
            onChange={(event) => fields.setAmount(event.target.value)}
            aria-label="Amount paid in SAR"
            className={`w-28 ${selectClass}`}
          />
          <select
            value={fields.method}
            disabled={pending}
            aria-label="Payment method"
            onChange={(event) => fields.setMethod(event.target.value as PaymentMethod)}
            className={selectClass}
          >
            {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            value={fields.reference}
            disabled={pending}
            onChange={(event) => fields.setReference(event.target.value)}
            maxLength={100}
            placeholder="Reference (optional)"
            aria-label="Payment reference"
            className={`w-40 ${selectClass}`}
          />
        </>
      )}
    </span>
  );
}

// Monthly price × months; "no expiry" suggests one month.
function suggestedPrice(prices: Record<string, number>, plan: string, duration: string): number {
  return (prices[plan] ?? 0) * (durationMonths(duration) ?? 1);
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
      className="inline-flex flex-col items-end gap-1"
      onSubmit={(event) => {
        event.preventDefault();
        run(
          () => action(value, durationMonths(duration), note, value === "free" ? null : payment.value()),
          () => {
            setNote("");
            payment.reset();
          },
        );
      }}
    >
      <span className="flex flex-wrap items-center justify-end gap-2">
        <select
          value={value}
          disabled={pending}
          aria-label="Plan"
          onChange={(event) => {
            setValue(event.target.value);
            payment.resetAmount();
          }}
          className={selectClass}
        >
          {plans.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {value !== "free" && (
          <select
            value={duration}
            disabled={pending}
            aria-label="Plan duration"
            onChange={(event) => {
              setDuration(event.target.value);
              payment.resetAmount();
            }}
            className={selectClass}
          >
            {durations.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
        <input
          value={note}
          disabled={pending}
          onChange={(event) => setNote(event.target.value)}
          maxLength={300}
          placeholder="Note (optional)"
          aria-label="Note for the plan history"
          className={`w-40 ${selectClass}`}
        />
        <button type="submit" disabled={pending} className={buttonClass}>
          Save
        </button>
      </span>
      {value !== "free" && <PaymentFields fields={payment.fields} pending={pending} />}
      {error && <span className="text-sm text-red-600">{error}</span>}
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
  const [duration, setDuration] = useState(durations[0]?.value ?? "1");
  const [note, setNote] = useState("");
  const payment = usePayment(suggestedPrice(prices, plan, duration));

  return (
    <form
      className="inline-flex flex-col items-end gap-1"
      onSubmit={(event) => {
        event.preventDefault();
        run(
          () => action(Number(duration), note, payment.value()),
          () => {
            setNote("");
            payment.reset();
          },
        );
      }}
    >
      <span className="flex flex-wrap items-center justify-end gap-2">
        <select
          value={duration}
          disabled={pending}
          aria-label="Extend by"
          onChange={(event) => {
            setDuration(event.target.value);
            payment.resetAmount();
          }}
          className={selectClass}
        >
          {durations.map((option) => (
            <option key={option.value} value={option.value}>
              +{option.label}
            </option>
          ))}
        </select>
        <input
          value={note}
          disabled={pending}
          onChange={(event) => setNote(event.target.value)}
          maxLength={300}
          placeholder="Note (optional)"
          aria-label="Note for the plan history"
          className={`w-40 ${selectClass}`}
        />
        <button type="submit" disabled={pending} className={buttonClass}>
          Extend
        </button>
      </span>
      <PaymentFields fields={payment.fields} pending={pending} />
      {error && <span className="text-sm text-red-600">{error}</span>}
    </form>
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
    <span className="inline-flex flex-col items-end gap-1">
      <span className="flex items-center gap-2">
        <select
          value={value}
          disabled={pending}
          aria-label="Plan to grant"
          onChange={(event) => setValue(event.target.value)}
          className={selectClass}
        >
          {plans.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={duration}
          disabled={pending}
          aria-label="Plan duration"
          onChange={(event) => setDuration(event.target.value)}
          className={selectClass}
        >
          {durations.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => action(value, durationMonths(duration)))}
          className={buttonClass}
        >
          Approve
        </button>
      </span>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </span>
  );
}
