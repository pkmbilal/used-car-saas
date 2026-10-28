"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Pencil, RotateCcw, Sparkles } from "lucide-react";
import { useDictionary } from "@/components/i18n-provider";
import Link from "@/components/locale-link";
import { Button } from "@/components/ui/button";
import { fmt, translateMessage } from "@/lib/dictionary";
import type { ListingStatus } from "@/lib/listings";
import {
  featureListing,
  requestFeaturedBoost,
  setListingStatus,
  type ActionResult,
} from "@/app/[lang]/(seller)/dashboard/listings/actions";

type Props = {
  listingId: string;
  status: ListingStatus;
  // Featured slots left this month; Boost shows when this is above 0.
  featureSlots: number;
  featureDays: number;
  // Whether a higher plan exists, for the "get featured slots" link.
  canUpgrade: boolean;
  // A paid boost, offered when there are no featured slots left; null when
  // the listing is already featured.
  boost: {
    label: string;
    pending: { note: string; whatsappUrl: string | null } | null;
  } | null;
};

const buttonClass = "h-10 w-full text-xs max-sm:text-sm font-medium";

// The seller's controls on their own listing page.
export function OwnerActions({ listingId, status, featureSlots, featureDays, canUpgrade, boost }: Props) {
  const router = useRouter();
  const { t } = useDictionary();
  const a = t.dashboard.actions;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function run(action: () => Promise<ActionResult>) {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      // The status action only revalidates the dashboard.
      if (result.error) setError(translateMessage(t, result.error));
      else router.refresh();
    });
  }

  if (status === "removed") return null;

  return (
    <div className="mt-4 flex flex-col gap-2.5">
      {status === "active" && featureSlots > 0 && (
        <Button type="button" disabled={pending} className={buttonClass} onClick={() => run(() => featureListing(listingId))}>
          <Sparkles className="size-3.5" />
          {fmt(a.feature, { days: featureDays, slots: featureSlots })}
        </Button>
      )}
      <div className="grid grid-cols-2 gap-2.5">
        <Button asChild variant="outline" className={`${buttonClass} bg-white`}>
          <Link href={`/dashboard/listings/${listingId}/edit`}>
            <Pencil className="size-3.5" />
            {a.edit}
          </Link>
        </Button>
        {status === "active" ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            className={`${buttonClass} bg-white`}
            onClick={() => run(() => setListingStatus(listingId, "sold"))}
          >
            <CheckCircle2 className="size-3.5" />
            {a.markSold}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            className={`${buttonClass} bg-white`}
            onClick={() => run(() => setListingStatus(listingId, "active"))}
          >
            <RotateCcw className="size-3.5" />
            {status === "sold" ? a.relist : a.publish}
          </Button>
        )}
      </div>
      {status === "active" && featureSlots === 0 && boost && !boost.pending && (
        <Button
          type="button"
          disabled={pending}
          className={buttonClass}
          onClick={() => run(() => requestFeaturedBoost(listingId))}
        >
          <Sparkles className="size-3.5" />
          {boost.label}
        </Button>
      )}
      {status === "active" && boost?.pending && (
        <div className="rounded-md bg-mint px-3 py-2 text-xs text-brand-600">
          <p className="flex items-start gap-1.5 font-medium">
            <Clock className="mt-px size-3.5 shrink-0" />
            {boost.pending.note}
          </p>
          {boost.pending.whatsappUrl && (
            <a
              href={boost.pending.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-block font-semibold underline"
            >
              {t.addons.payOnWhatsapp}
            </a>
          )}
        </div>
      )}
      {status === "active" && featureSlots === 0 && canUpgrade && (
        <Link href="/pricing" className="text-xs font-semibold text-brand hover:underline">
          {t.listingPage.boostUpsell}
        </Link>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
