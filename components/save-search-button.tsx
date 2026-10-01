"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveSearchAction, type SaveSearchState } from "@/app/saved-searches/actions";

type Props = {
  // The validated filters as query params (see listingFiltersToParams).
  params: Record<string, string>;
  defaultName: string;
  maxNameLength: number;
  signedIn: boolean;
  loginHref: string;
};

// Render with a `key` of the current filters so a saved state doesn't carry
// over to a different search.
export function SaveSearchButton({
  params,
  defaultName,
  maxNameLength,
  signedIn,
  loginHref,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<SaveSearchState, FormData>(
    saveSearchAction,
    {},
  );

  // The session may have expired since the page rendered.
  useEffect(() => {
    if (state.error === "signin") router.push(loginHref);
  }, [state.error, router, loginHref]);

  if (state.saved) {
    return (
      <p className="text-sm text-muted">
        Search saved.{" "}
        <Link href="/saved-searches" className="font-medium underline">
          View saved searches
        </Link>
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => (signedIn ? setOpen(true) : router.push(loginHref))}
        className="rounded-md border border-brand bg-white px-3 py-1.5 text-xs font-semibold text-brand hover:bg-mint"
      >
        Save this search
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2 text-sm">
      {Object.entries(params).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <input
        name="name"
        required
        maxLength={maxNameLength}
        defaultValue={defaultName}
        aria-label="Search name"
        className="min-w-0 flex-1 rounded-md border border-line bg-white px-3 py-1.5"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-3 py-1.5 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-muted">
        Cancel
      </button>
      {state.error && state.error !== "signin" && (
        <p className="w-full text-red-600">{state.error}</p>
      )}
    </form>
  );
}
