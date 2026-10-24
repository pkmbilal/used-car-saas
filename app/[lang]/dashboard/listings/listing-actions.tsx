"use client";

import { useState, useTransition } from "react";
import { useDictionary } from "@/components/i18n-provider";
import Link from "@/components/locale-link";
import { useRouter } from "next/navigation";
import { fmt, translateMessage } from "@/lib/dictionary";
import { localizePath } from "@/lib/i18n";
import type { ListingStatus } from "@/lib/listings";
import { deleteListing, featureListing, setListingStatus, type ActionResult } from "./actions";

type Props = {
  listingId: string;
  status: ListingStatus;
  showEdit?: boolean;
  // Featured slots left this month; the button shows when this is above 0.
  featureSlots?: number;
  featureDays?: number;
};

const buttonClass = "text-sm font-medium underline-offset-4 hover:underline disabled:opacity-50";

export function ListingActions({
  listingId,
  status,
  showEdit = false,
  featureSlots = 0,
  featureDays,
}: Props) {
  const router = useRouter();
  const { t, locale } = useDictionary();
  const a = t.dashboard.actions;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function run(action: () => Promise<ActionResult>, after?: () => void) {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(translateMessage(t, result.error));
      else after?.();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Link href={`/listings/${listingId}`} className={buttonClass}>
          {a.view}
        </Link>
        {showEdit && (
          <Link href={`/dashboard/listings/${listingId}/edit`} className={buttonClass}>
            {a.edit}
          </Link>
        )}
        {(status === "draft" || status === "sold") && (
          <button
            type="button"
            disabled={pending}
            className={`${buttonClass} text-green-700 dark:text-green-400`}
            onClick={() => run(() => setListingStatus(listingId, "active"))}
          >
            {status === "sold" ? a.relist : a.publish}
          </button>
        )}
        {status === "active" && (
          <button
            type="button"
            disabled={pending}
            className={buttonClass}
            onClick={() => run(() => setListingStatus(listingId, "sold"))}
          >
            {a.markSold}
          </button>
        )}
        {status === "active" && featureSlots > 0 && (
          <button
            type="button"
            disabled={pending}
            className={`${buttonClass} text-amber-700 dark:text-amber-400`}
            onClick={() => run(() => featureListing(listingId))}
          >
            {fmt(a.feature, { days: featureDays ?? "", slots: featureSlots })}
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          className={`${buttonClass} text-red-600`}
          onClick={() => {
            if (!window.confirm(a.confirmDelete)) return;
            run(
              () => deleteListing(listingId),
              () => router.push(localizePath(locale, "/dashboard")),
            );
          }}
        >
          {a.delete}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
