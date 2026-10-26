"use client";

import { useState, useTransition } from "react";
import { useDictionary } from "@/components/i18n-provider";
import Link from "@/components/locale-link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CircleCheck,
  Eye,
  Loader2,
  Pencil,
  RotateCcw,
  Send,
  Star,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  // (dashboard list view), "inline" a pill toolbar (edit page header).
  variant?: "inline" | "card" | "row";
};

const inlinePillClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[.97] disabled:opacity-50 motion-safe:hover:-translate-y-px dark:focus-visible:ring-offset-zinc-950";
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

// Inline: publishing is the page's main action, and delete is a round icon
// set slightly apart.
const inlineTones: Record<keyof typeof tones, string> = {
  ...tones,
  publish: `${tones.edit} hover:shadow-lg hover:shadow-forest/30`,
  delete: `${tones.delete} ms-1 size-10 px-0`,
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
  const [confirming, setConfirming] = useState(false);

  const card = variant === "card";
  const row = variant === "row";
  const cls = (pill: keyof typeof tones) => {
    if (card) return `${pillClass} ${cardLayout[pill]} ${tones[pill]}`;
    // Mobile: one row of equal-width icon buttons; labels come back at sm.
    if (row)
      return `${rowPillClass} ${pill === "delete" ? "w-9 shrink-0 px-0" : "min-w-0 flex-1 sm:flex-none"} ${tones[pill]}`;
    return `${inlinePillClass} ${inlineTones[pill]}`;
  };
  const icon = (Icon: LucideIcon) => <Icon className="size-4 shrink-0" aria-hidden />;
  const label = (text: string) =>
    row ? <span className="truncate max-sm:sr-only">{text}</span> : text;
  const tip = (text: string) => (card ? undefined : text);
  const featureLabel = fmt(a.feature, { days: featureDays ?? "", slots: featureSlots });
  const publishLabel = status === "sold" ? a.relist : a.publish;

  function run(action: () => Promise<ActionResult>) {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(translateMessage(t, result.error));
    });
  }

  function confirmDelete() {
    setError(undefined);
    startTransition(async () => {
      const result = await deleteListing(listingId);
      if (result.error) {
        setConfirming(false);
        setError(translateMessage(t, result.error));
      } else {
        router.push(localizePath(locale, "/dashboard"));
      }
    });
  }

  const statusActions = (
    <>
      {(status === "draft" || status === "sold") && (
        <button
          type="button"
          disabled={pending}
          title={row ? publishLabel : undefined}
          className={cls("publish")}
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
          title={row ? a.markSold : undefined}
          className={cls("markSold")}
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
          title={row ? featureLabel : undefined}
          className={cls("feature")}
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
    <div className={`flex flex-col gap-2 ${card ? "" : "sm:items-end"}`}>
      <div
        className={`flex items-center ${card ? "flex-wrap gap-2" : row ? "gap-1.5 sm:flex-wrap sm:justify-end sm:gap-2" : "flex-wrap gap-2 sm:justify-end"}`}
      >
        <Link href={`/listings/${listingId}`} title={row ? a.view : undefined} className={cls("view")}>
          {icon(Eye)}
          {label(a.view)}
        </Link>
        {showEdit && (
          <Link
            href={`/dashboard/listings/${listingId}/edit`}
            title={row ? a.edit : undefined}
            className={cls("edit")}
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
          className={cls("delete")}
          onClick={() => setConfirming(true)}
        >
          {icon(Trash2)}
          <span className="sr-only">{a.delete}</span>
        </button>
      </div>
      {error && (
        <p className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <Dialog open={confirming} onOpenChange={(open) => !pending && setConfirming(open)}>
        <DialogContent className="light sm:max-w-sm" showCloseButton={false}>
          <DialogHeader className="items-center text-center sm:items-center sm:text-center">
            <span className="mb-1 grid size-12 place-items-center rounded-full bg-red-50 text-red-600 ring-8 ring-red-50/50">
              <Trash2 className="size-5" aria-hidden />
            </span>
            <DialogTitle>{a.deleteTitle}</DialogTitle>
            <DialogDescription>{a.confirmDelete}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-center">
            <DialogClose asChild>
              <button
                type="button"
                disabled={pending}
                className={`${inlinePillClass} ${tones.view} px-5`}
              >
                {t.common.cancel}
              </button>
            </DialogClose>
            <button
              type="button"
              disabled={pending}
              onClick={confirmDelete}
              className={`${inlinePillClass} bg-red-600 px-5 text-white shadow-md shadow-red-600/25 hover:bg-red-700 focus-visible:ring-red-500/40`}
            >
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon(Trash2)}
              {a.delete}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
