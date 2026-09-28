"use client";

import { useState, useTransition } from "react";
import type { AdminResult } from "@/lib/admin";
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
