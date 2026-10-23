"use client";

import { useActionState, useEffect, useState } from "react";
import Link, { useLocale } from "@/components/locale-link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveSearchAction, type SaveSearchState } from "@/app/[lang]/saved-searches/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { localizePath } from "@/lib/i18n";

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
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<SaveSearchState, FormData>(
    saveSearchAction,
    {},
  );

  // The session may have expired since the page rendered.
  useEffect(() => {
    if (state.error === "signin") router.push(localizePath(locale, loginHref));
  }, [state.error, router, locale, loginHref]);

  useEffect(() => {
    if (state.saved) toast.success("Search saved");
  }, [state.saved]);

  if (state.saved) {
    return (
      <p className="text-sm text-muted-foreground">
        Search saved.{" "}
        <Link href="/saved-searches" className="font-medium underline">
          View saved searches
        </Link>
      </p>
    );
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => (signedIn ? setOpen(true) : router.push(localizePath(locale, loginHref)))}
        className="border-brand bg-white text-xs font-semibold text-brand hover:bg-mint hover:text-brand"
      >
        Save this search
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2 text-sm">
      {Object.entries(params).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <Input
        name="name"
        required
        maxLength={maxNameLength}
        defaultValue={defaultName}
        aria-label="Search name"
        className="h-8 min-w-0 flex-1 bg-white"
      />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      {state.error && state.error !== "signin" && (
        <p className="w-full text-destructive">{state.error}</p>
      )}
    </form>
  );
}
