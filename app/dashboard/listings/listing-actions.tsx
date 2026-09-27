"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ListingStatus } from "@/lib/listings";
import { deleteListing, setListingStatus, type ActionResult } from "./actions";

type Props = {
  listingId: string;
  status: ListingStatus;
  showEdit?: boolean;
};

const buttonClass = "text-sm font-medium underline-offset-4 hover:underline disabled:opacity-50";

export function ListingActions({ listingId, status, showEdit = false }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function run(action: () => Promise<ActionResult>, after?: () => void) {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      else after?.();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Link href={`/listings/${listingId}`} className={buttonClass}>
          View
        </Link>
        {showEdit && (
          <Link href={`/dashboard/listings/${listingId}/edit`} className={buttonClass}>
            Edit
          </Link>
        )}
        {(status === "draft" || status === "sold") && (
          <button
            type="button"
            disabled={pending}
            className={`${buttonClass} text-green-700 dark:text-green-400`}
            onClick={() => run(() => setListingStatus(listingId, "active"))}
          >
            {status === "sold" ? "Relist" : "Publish"}
          </button>
        )}
        {status === "active" && (
          <button
            type="button"
            disabled={pending}
            className={buttonClass}
            onClick={() => run(() => setListingStatus(listingId, "sold"))}
          >
            Mark as sold
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          className={`${buttonClass} text-red-600`}
          onClick={() => {
            if (!window.confirm("Delete this listing and its photos? This can't be undone.")) return;
            run(
              () => deleteListing(listingId),
              () => router.push("/dashboard"),
            );
          }}
        >
          Delete
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
