"use client";

import { useActionState, useState } from "react";
import { useDictionary } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_RENTAL_NOTE } from "@/lib/rental-quote";
import { respondToRental, type RentalActionState } from "./actions";

const primary =
  "min-h-10 rounded-full bg-gradient-to-b from-brand to-forest px-5 font-semibold text-white shadow-md shadow-forest/25 hover:text-white hover:brightness-110";
const outline = "min-h-10 rounded-full px-4 font-semibold";
const ghost = "min-h-10 rounded-full px-4 text-zinc-600 dark:text-zinc-400";

type Props = {
  requestId: string;
  side: "owner" | "renter";
  // Renters can cancel an accepted booking too; the label says which.
  accepted?: boolean;
};

export function BookingActions({ requestId, side, accepted = false }: Props) {
  const { t } = useDictionary();
  const r = t.rentals;
  // Owners confirm a decline in a small panel with an optional reason.
  const [declining, setDeclining] = useState(false);
  const [state, formAction, pending] = useActionState<RentalActionState, FormData>(
    respondToRental.bind(null, requestId, side),
    {},
  );

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-2">
      {side === "owner" && declining && (
        <div className="flex flex-col gap-1.5 rounded-xl bg-canvas p-3 dark:bg-zinc-900">
          <Label htmlFor={`decline-${requestId}`}>{r.declineReason}</Label>
          <Textarea
            id={`decline-${requestId}`}
            name="reason"
            rows={2}
            maxLength={MAX_RENTAL_NOTE}
            placeholder={r.declineReasonPlaceholder}
            className="bg-white dark:bg-zinc-950"
          />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {side === "owner" ? (
          declining ? (
            <>
              <Button type="submit" name="action" value="decline" size="sm" className={primary} disabled={pending}>
                {pending ? r.working : r.confirmDecline}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={outline}
                disabled={pending}
                onClick={() => setDeclining(false)}
              >
                {r.back}
              </Button>
            </>
          ) : (
            <>
              <Button type="submit" name="action" value="accept" size="sm" className={primary} disabled={pending}>
                {pending ? r.working : r.accept}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className={ghost}
                disabled={pending}
                onClick={() => setDeclining(true)}
              >
                {r.decline}
              </Button>
            </>
          )
        ) : (
          <Button type="submit" name="action" value="cancel" size="sm" variant="ghost" className={ghost} disabled={pending}>
            {pending ? r.working : accepted ? r.cancelBooking : r.cancel}
          </Button>
        )}
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {r.errors[state.error]}
        </p>
      )}
    </form>
  );
}
