"use client";

import { useActionState, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HandCoins } from "lucide-react";
import Link from "@/components/locale-link";
import { useDictionary } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fmt } from "@/lib/dictionary";
import { formatSAR } from "@/lib/format";
import { localizePath } from "@/lib/i18n";
import { MAX_OFFER_NOTE, minOffer } from "@/lib/offer-limits";
import type { MyOffer } from "@/lib/offers";
import { sendOffer, type OfferState } from "./actions";

type Props = {
  listingId: string;
  price: number;
  signedIn: boolean;
  // The buyer's latest offer on this listing.
  myOffer: MyOffer | null;
};

export function MakeOfferButton({ listingId, price, signedIn, myOffer }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, locale } = useDictionary();
  const o = t.listingPage.offer;
  const loginHref = localizePath(locale, `/login?next=${encodeURIComponent(pathname)}`);
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<OfferState, FormData>(
    sendOffer.bind(null, listingId),
    {},
  );

  // The session may have expired since the page rendered.
  useEffect(() => {
    if (state.error === "signin") router.push(loginHref);
  }, [state.error, router, loginHref]);

  if (myOffer && (myOffer.status === "pending" || myOffer.status === "countered" || myOffer.status === "accepted")) {
    const status =
      myOffer.status === "pending"
        ? o.status.pending
        : fmt(o.status[myOffer.status], {
            amount: formatSAR(myOffer.status === "countered" ? (myOffer.counterAmount ?? myOffer.amount) : myOffer.amount, locale),
          });
    return (
      <div className="rounded-lg bg-mint px-3.5 py-3 text-sm">
        <p className="font-semibold text-ink">{fmt(o.yours, { amount: formatSAR(myOffer.amount, locale) })}</p>
        <p className="mt-0.5 text-muted-foreground">{status}</p>
        <Link href="/offers" className="mt-1.5 inline-block text-xs font-semibold text-brand hover:underline">
          {o.viewOffers}
        </Link>
      </div>
    );
  }

  const min = minOffer(price);
  const max = price - 1;
  const error = state.error && state.error !== "signin" ? state.error : null;

  return (
    // Sending revalidates the page, so the new offer arrives as myOffer.
    <Dialog open={open && !state.sent} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        onClick={() => (signedIn ? setOpen(true) : router.push(loginHref))}
        className="h-11 border-brand text-label font-semibold text-ink hover:bg-mint"
      >
        <HandCoins className="size-4 text-brand" />
        {o.makeOffer}
      </Button>
      <DialogContent className="light sm:max-w-md">
        <form action={formAction} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>{o.makeOffer}</DialogTitle>
            <DialogDescription>{o.description}</DialogDescription>
          </DialogHeader>
          <p className="text-sm font-medium">{fmt(o.asking, { price: formatSAR(price, locale) })}</p>
          <div className="flex flex-col gap-2">
            <Label htmlFor="offer-amount">{o.amount}</Label>
            <Input
              id="offer-amount"
              name="amount"
              type="number"
              inputMode="numeric"
              dir="ltr"
              min={min}
              max={max}
              step={1}
              required
            />
            <p className="text-xs text-muted-foreground">
              {fmt(o.range, { min: formatSAR(min, locale), max: formatSAR(max, locale) })}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="offer-note">{o.note}</Label>
            <Textarea
              id="offer-note"
              name="note"
              rows={3}
              maxLength={MAX_OFFER_NOTE}
              placeholder={o.notePlaceholder}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {t.offers.errors[error]}
              {error === "phone_required" && (
                <>
                  {" "}
                  <Link href="/account" className="font-medium underline">
                    {o.addPhone}
                  </Link>
                </>
              )}
            </p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t.common.cancel}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? o.sending : o.send}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
