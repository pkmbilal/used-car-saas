"use client";

import { useActionState, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { reportListing, type ReportState } from "@/app/listings/[id]/actions";
import { MAX_REPORT_DETAILS, REPORT_REASONS } from "@/lib/moderation";

type Props = {
  listingId: string;
  signedIn: boolean;
};

export function ReportListingButton({ listingId, signedIn }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const loginHref = `/login?next=${encodeURIComponent(pathname)}`;
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ReportState, FormData>(
    reportListing.bind(null, listingId),
    {},
  );

  // The session may have expired since the page rendered.
  useEffect(() => {
    if (state.error === "signin") router.push(loginHref);
  }, [state.error, router, loginHref]);

  if (state.sent) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Thanks — our team will review this listing.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => (signedIn ? setOpen(true) : router.push(loginHref))}
        className="self-start text-sm text-zinc-500 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        Report this listing
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800"
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-medium">What&apos;s wrong with this listing?</legend>
        {Object.entries(REPORT_REASONS).map(([value, label]) => (
          <label key={value} className="flex items-center gap-2">
            <input type="radio" name="reason" value={value} required />
            {label}
          </label>
        ))}
      </fieldset>
      <label className="flex flex-col gap-1">
        <span className="font-medium">Details (optional)</span>
        <textarea
          name="details"
          rows={3}
          maxLength={MAX_REPORT_DETAILS}
          className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      {state.error && state.error !== "signin" && (
        <p className="text-red-600">{state.error}</p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-3 py-1.5 font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "Sending…" : "Send report"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-zinc-600 dark:text-zinc-400">
          Cancel
        </button>
      </div>
    </form>
  );
}
