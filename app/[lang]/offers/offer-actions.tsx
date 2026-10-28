"use client";

import { useActionState, useState } from "react";
import { useDictionary } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fmt } from "@/lib/dictionary";
import { formatSAR } from "@/lib/format";
import { respondToOffer, type OfferActionState } from "./actions";

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
        <div className="flex flex-col gap-1.5">
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
            className="max-w-48"
          />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {side === "seller" ? (
          countering ? (
            <>
              <Button type="submit" name="action" value="counter" size="sm" disabled={pending}>
                {pending ? o.working : o.sendCounter}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setCountering(false)}>
                {o.cancel}
              </Button>
            </>
          ) : (
            <>
              <Button type="submit" name="action" value="accept" size="sm" disabled={pending}>
                {o.accept}
              </Button>
              {askingPrice !== null && amount + 1 <= askingPrice && (
                <Button type="button" size="sm" variant="outline" onClick={() => setCountering(true)}>
                  {o.counter}
                </Button>
              )}
              <Button type="submit" name="action" value="decline" size="sm" variant="ghost" disabled={pending}>
                {o.decline}
              </Button>
            </>
          )
        ) : counterAmount !== null ? (
          <>
            <Button type="submit" name="action" value="accept" size="sm" disabled={pending}>
              {fmt(o.acceptCounter, { amount: formatSAR(counterAmount, locale) })}
            </Button>
            <Button type="submit" name="action" value="decline" size="sm" variant="ghost" disabled={pending}>
              {o.decline}
            </Button>
          </>
        ) : (
          <Button type="submit" name="action" value="withdraw" size="sm" variant="ghost" disabled={pending}>
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
