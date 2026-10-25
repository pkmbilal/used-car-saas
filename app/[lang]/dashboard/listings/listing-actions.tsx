"use client";

import { useState, useTransition } from "react";
import { useDictionary } from "@/components/i18n-provider";
import Link from "@/components/locale-link";
import { useRouter } from "next/navigation";
import { CircleCheck, Eye, Pencil, RotateCcw, Send, Star, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
  // "card" shows full buttons (dashboard card view) instead of text links.
  variant?: "inline" | "card";
};

const buttonClass = "text-sm font-medium underline-offset-4 hover:underline disabled:opacity-50";
const pillClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-center text-sm font-medium transition active:scale-[.97] disabled:opacity-50";

// Row 1: edit, view, delete; row 2: the status actions.
const pills = {
  edit: "order-1 flex-1 bg-gradient-to-b from-brand to-forest text-white shadow-md shadow-forest/25 hover:text-white hover:brightness-110",
  view: "order-2 flex-1 bg-white text-ink shadow-sm ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-800",
  delete: "order-3 size-11 shrink-0 bg-red-50 px-0 text-red-600 ring-1 ring-red-200 hover:bg-red-100 dark:bg-red-950 dark:ring-red-900",
  publish: "flex-1 bg-green-50 text-green-700 ring-1 ring-green-200 hover:bg-green-100 dark:bg-green-950 dark:text-green-400 dark:ring-green-900",
  markSold: "flex-1 bg-zinc-100 text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700",
  feature: "flex-1 bg-gradient-to-b from-lime-light to-lime text-on-lime shadow-[inset_0_1px_0_rgba(255,255,255,.45)] hover:brightness-105",
};

export function ListingActions({
  listingId,
  status,
  showEdit = false,
  featureSlots = 0,
  featureDays,
  variant = "inline",
}: Props) {
  const router = useRouter();
  const { t, locale } = useDictionary();
  const a = t.dashboard.actions;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const card = variant === "card";
  const cls = (extra: string, pill: keyof typeof pills) =>
    card ? `${pillClass} ${pills[pill]}` : `${buttonClass} ${extra}`;
  const icon = (Icon: LucideIcon) => card && <Icon className="size-4 shrink-0" aria-hidden />;

  function run(action: () => Promise<ActionResult>, after?: () => void) {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(translateMessage(t, result.error));
      else after?.();
    });
  }

  const statusActions = (
    <>
      {(status === "draft" || status === "sold") && (
        <button
          type="button"
          disabled={pending}
          className={cls("text-green-700 dark:text-green-400", "publish")}
          onClick={() => run(() => setListingStatus(listingId, "active"))}
        >
          {icon(status === "sold" ? RotateCcw : Send)}
          {status === "sold" ? a.relist : a.publish}
        </button>
      )}
      {status === "active" && (
        <button
          type="button"
          disabled={pending}
          className={cls("", "markSold")}
          onClick={() => run(() => setListingStatus(listingId, "sold"))}
        >
          {icon(CircleCheck)}
          {a.markSold}
        </button>
      )}
      {status === "active" && featureSlots > 0 && (
        <button
          type="button"
          disabled={pending}
          className={cls("text-amber-700 dark:text-amber-400", "feature")}
          onClick={() => run(() => featureListing(listingId))}
        >
          {icon(Star)}
          {fmt(a.feature, { days: featureDays ?? "", slots: featureSlots })}
        </button>
      )}
    </>
  );
  const hasStatusActions = status !== "removed";

  return (
    <div className={`flex flex-col gap-1 ${card ? "" : "items-end"}`}>
      <div
        className={`flex flex-wrap items-center ${card ? "gap-2" : "justify-end gap-3"}`}
      >
        <Link href={`/listings/${listingId}`} className={cls("", "view")}>
          {icon(Eye)}
          {a.view}
        </Link>
        {showEdit && (
          <Link href={`/dashboard/listings/${listingId}/edit`} className={cls("", "edit")}>
            {icon(Pencil)}
            {a.edit}
          </Link>
        )}
        {card
          ? hasStatusActions && (
              <div className="order-4 flex w-full gap-2">{statusActions}</div>
            )
          : statusActions}
        <button
          type="button"
          disabled={pending}
          className={cls("text-red-600", "delete")}
          onClick={() => {
            if (!window.confirm(a.confirmDelete)) return;
            run(
              () => deleteListing(listingId),
              () => router.push(localizePath(locale, "/dashboard")),
            );
          }}
        >
          {icon(Trash2)}
          {card ? <span className="sr-only">{a.delete}</span> : a.delete}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
