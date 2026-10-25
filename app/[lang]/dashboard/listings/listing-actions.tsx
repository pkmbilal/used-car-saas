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
  // "card" shows full buttons (dashboard card view), "row" compact buttons
  // (dashboard list view), "inline" text links.
  variant?: "inline" | "card" | "row";
};

const buttonClass = "text-sm font-medium underline-offset-4 hover:underline disabled:opacity-50";
const pillClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-center text-sm font-medium transition active:scale-[.97] disabled:opacity-50";

const rowPillClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium transition active:scale-[.97] disabled:opacity-50";

const tones = {
  edit: "bg-gradient-to-b from-brand to-forest text-white shadow-md shadow-forest/25 hover:text-white hover:brightness-110",
  view: "bg-white text-ink shadow-sm ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-800",
  delete: "bg-red-50 text-red-600 ring-1 ring-red-200 hover:bg-red-100 dark:bg-red-950 dark:ring-red-900",
  publish: "bg-green-50 text-green-700 ring-1 ring-green-200 hover:bg-green-100 dark:bg-green-950 dark:text-green-400 dark:ring-green-900",
  markSold: "bg-zinc-100 text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700",
  feature: "bg-gradient-to-b from-lime-light to-lime text-on-lime shadow-[inset_0_1px_0_rgba(255,255,255,.45)] hover:brightness-105",
};

// Card: row 1 is edit, view, delete; row 2 the status actions.
const cardLayout: Record<keyof typeof tones, string> = {
  edit: "order-1 flex-1",
  view: "order-2 flex-1",
  delete: "order-3 size-11 shrink-0 px-0",
  publish: "flex-1",
  markSold: "flex-1",
  feature: "flex-1",
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
  const row = variant === "row";
  const cls = (extra: string, pill: keyof typeof tones) => {
    if (card) return `${pillClass} ${cardLayout[pill]} ${tones[pill]}`;
    // Mobile: one row of equal-width icon buttons; labels come back at sm.
    if (row)
      return `${rowPillClass} ${pill === "delete" ? "w-9 shrink-0 px-0" : "min-w-0 flex-1 sm:flex-none"} ${tones[pill]}`;
    return `${buttonClass} ${extra}`;
  };
  const icon = (Icon: LucideIcon) =>
    (card || row) && <Icon className="size-4 shrink-0" aria-hidden />;
  const label = (text: string) =>
    row ? <span className="truncate max-sm:sr-only">{text}</span> : text;
  const tip = (text: string) => (row ? text : undefined);
  const featureLabel = fmt(a.feature, { days: featureDays ?? "", slots: featureSlots });
  const publishLabel = status === "sold" ? a.relist : a.publish;

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
          title={tip(publishLabel)}
          className={cls("text-green-700 dark:text-green-400", "publish")}
          onClick={() => run(() => setListingStatus(listingId, "active"))}
        >
          {icon(status === "sold" ? RotateCcw : Send)}
          {label(publishLabel)}
        </button>
      )}
      {status === "active" && (
        <button
          type="button"
          disabled={pending}
          title={tip(a.markSold)}
          className={cls("", "markSold")}
          onClick={() => run(() => setListingStatus(listingId, "sold"))}
        >
          {icon(CircleCheck)}
          {label(a.markSold)}
        </button>
      )}
      {status === "active" && featureSlots > 0 && (
        <button
          type="button"
          disabled={pending}
          title={tip(featureLabel)}
          className={cls("text-amber-700 dark:text-amber-400", "feature")}
          onClick={() => run(() => featureListing(listingId))}
        >
          {icon(Star)}
          {label(featureLabel)}
        </button>
      )}
    </>
  );
  const hasStatusActions = status !== "removed";

  return (
    <div className={`flex flex-col gap-1 ${card ? "" : row ? "sm:items-end" : "items-end"}`}>
      <div
        className={`flex items-center ${card ? "flex-wrap gap-2" : row ? "gap-1.5 sm:flex-wrap sm:justify-end sm:gap-2" : "flex-wrap justify-end gap-3"}`}
      >
        <Link href={`/listings/${listingId}`} title={tip(a.view)} className={cls("", "view")}>
          {icon(Eye)}
          {label(a.view)}
        </Link>
        {showEdit && (
          <Link
            href={`/dashboard/listings/${listingId}/edit`}
            title={tip(a.edit)}
            className={cls("", "edit")}
          >
            {icon(Pencil)}
            {label(a.edit)}
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
          title={tip(a.delete)}
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
          {card || row ? <span className="sr-only">{a.delete}</span> : a.delete}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
