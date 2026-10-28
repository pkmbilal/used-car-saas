"use client";

import { useActionState, useState } from "react";
import { useDictionary } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fmt } from "@/lib/dictionary";
import { formatSAR } from "@/lib/format";
import { respondToOffer, type OfferActionState } from "./actions";

// Accept-style buttons share the brand gradient used across the premium pages.
const primary =
  "min-h-10 rounded-full bg-gradient-to-b from-brand to-forest px-5 font-semibold text-white shadow-md shadow-forest/25 hover:text-white hover:brightness-110";
const outline = "min-h-10 rounded-full px-4 font-semibold";
const ghost = "min-h-10 rounded-full px-4 text-zinc-600 dark:text-zinc-400";

type Props = {
  offerId: string;
  side: "seller" | "buyer";
  // Seller: the buyer's offer and the asking price bound the counter.
  amount: number;
  askingPrice: number | null;
  // Buyer: the seller's counter, when there is one.
  counterAmount: number | null;
};

export function OfferActions({ offerId, side, amount, askingPrice, counterAmount }: Props) {
  const { t, locale } = useDictionary();
  const o = t.offers;
  const [countering, setCountering] = useState(false);
  const [state, formAction, pending] = useActionState<OfferActionState, FormData>(
    respondToOffer.bind(null, offerId, side),
    {},
  );

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-2">
      {side === "seller" && countering && (
        <div className="flex flex-col gap-1.5 rounded-xl bg-canvas p-3 dark:bg-zinc-900">
          <Label htmlFor={`counter-${offerId}`}>{o.counterAmount}</Label>
          <Input
            id={`counter-${offerId}`}
            name="counter"
            type="number"
            inputMode="numeric"
            dir="ltr"
            min={amount + 1}
            max={askingPrice ?? undefined}
            step={1}
            required
            className="max-w-48 bg-white dark:bg-zinc-950"
          />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {side === "seller" ? (
          countering ? (
            <>
              <Button type="submit" name="action" value="counter" size="sm" className={primary} disabled={pending}>
                {pending ? o.working : o.sendCounter}
              </Button>
              <Button type="button" size="sm" variant="outline" className={outline} onClick={() => setCountering(false)}>
                {o.cancel}
              </Button>
            </>
          ) : (
            <>
              <Button type="submit" name="action" value="accept" size="sm" className={primary} disabled={pending}>
                {o.accept}
              </Button>
              {askingPrice !== null && amount + 1 <= askingPrice && (
                <Button type="button" size="sm" variant="outline" className={outline} onClick={() => setCountering(true)}>
                  {o.counter}
                </Button>
              )}
              <Button type="submit" name="action" value="decline" size="sm" variant="ghost" className={ghost} disabled={pending}>
                {o.decline}
              </Button>
            </>
          )
        ) : counterAmount !== null ? (
          <>
            <Button type="submit" name="action" value="accept" size="sm" className={primary} disabled={pending}>
              {fmt(o.acceptCounter, { amount: formatSAR(counterAmount, locale) })}
            </Button>
            <Button type="submit" name="action" value="decline" size="sm" variant="ghost" className={ghost} disabled={pending}>
              {o.decline}
            </Button>
          </>
        ) : (
          <Button type="submit" name="action" value="withdraw" size="sm" variant="ghost" className={ghost} disabled={pending}>
            {o.withdraw}
          </Button>
        )}
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {o.errors[state.error]}
        </p>
      )}
    </form>
  );
}
