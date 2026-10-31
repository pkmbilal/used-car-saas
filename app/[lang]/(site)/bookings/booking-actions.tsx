"use client";

import { useActionState } from "react";
import { useDictionary } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { respondToRental, type RentalActionState } from "./actions";

const primary =
  "min-h-10 rounded-full bg-gradient-to-b from-brand to-forest px-5 font-semibold text-white shadow-md shadow-forest/25 hover:text-white hover:brightness-110";
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
  const [state, formAction, pending] = useActionState<RentalActionState, FormData>(
    respondToRental.bind(null, requestId, side),
    {},
  );

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {side === "owner" ? (
          <>
            <Button type="submit" name="action" value="accept" size="sm" className={primary} disabled={pending}>
              {pending ? r.working : r.accept}
            </Button>
            <Button type="submit" name="action" value="decline" size="sm" variant="ghost" className={ghost} disabled={pending}>
              {r.decline}
            </Button>
          </>
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
