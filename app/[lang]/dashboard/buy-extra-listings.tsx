"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, PlusCircle } from "lucide-react";
import { useDictionary } from "@/components/i18n-provider";
import { translateMessage } from "@/lib/dictionary";
import { cn } from "@/lib/utils";
import { requestExtraListings } from "./listings/actions";

export type ExtraListingsOffer = {
  packs: { quantity: number; label: string; price: string }[];
  pending: { note: string; whatsappUrl: string | null } | null;
};

// Lets a seller on a limited plan request a pack of extra listings, or shows
// the request waiting for payment.
export function BuyExtraListings({ offer }: { offer: ExtraListingsOffer }) {
  const router = useRouter();
  const { t } = useDictionary();
  const a = t.addons;
  const [quantity, setQuantity] = useState(offer.packs[0]?.quantity ?? 1);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  if (offer.pending) {
    return (
      <div className="text-sm text-white/85">
        <p className="flex items-start gap-2">
          <Clock className="mt-0.5 size-4 shrink-0 text-lime" aria-hidden />
          {offer.pending.note}
        </p>
        {offer.pending.whatsappUrl && (
          <a
            href={offer.pending.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ms-6 mt-1 inline-block font-semibold text-lime underline"
          >
            {a.payOnWhatsapp}
          </a>
        )}
      </div>
    );
  }

  function submit() {
    setError(undefined);
    startTransition(async () => {
      const result = await requestExtraListings(quantity);
      if (result.error) setError(translateMessage(t, result.error));
      else router.refresh();
    });
  }

  return (
    <div>
      <p className="flex items-center gap-1.5 text-sm font-semibold">
        <PlusCircle className="size-4 text-lime" aria-hidden />
        {a.buyTitle}
      </p>
      <p className="mt-1 text-xs text-white/70">{a.buyIntro}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div role="radiogroup" aria-label={a.buyTitle} className="flex flex-wrap gap-2">
          {offer.packs.map((pack) => (
            <button
              key={pack.quantity}
              type="button"
              role="radio"
              aria-checked={quantity === pack.quantity}
              onClick={() => setQuantity(pack.quantity)}
              className={cn(
                "min-h-10 rounded-full px-3.5 text-sm ring-1 transition-colors",
                quantity === pack.quantity
                  ? "bg-white text-forest ring-white"
                  : "text-white/85 ring-white/25 hover:bg-white/10",
              )}
            >
              {pack.label} · <span className="font-semibold">{pack.price}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={submit}
          className="min-h-10 rounded-full bg-gradient-to-b from-lime-light to-lime px-4 text-sm font-semibold text-on-lime disabled:opacity-60"
        >
          {pending ? a.requesting : a.request}
        </button>
      </div>
      <p className="mt-1.5 text-xs text-white/55">{a.plusVat}</p>
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}
