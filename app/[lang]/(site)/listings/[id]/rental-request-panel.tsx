"use client";

import { useActionState, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CalendarCheck, CalendarX } from "lucide-react";
import Link from "@/components/locale-link";
import { useDictionary } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { count, fmt } from "@/lib/dictionary";
import { formatDay, formatSAR } from "@/lib/format";
import { localizePath } from "@/lib/i18n";
import {
  addDays,
  MAX_RENTAL_DAYS,
  MAX_RENTAL_NOTE,
  overlapsAny,
  quoteRental,
  rentalDays,
  todayInRiyadh,
  type DateRange,
  type RentalRates,
} from "@/lib/rental-quote";
import type { MyRentalRequest } from "@/lib/rentals";
import { sendRentalRequest, type RentalRequestState } from "./actions";

type Props = {
  listingId: string;
  rates: RentalRates;
  minDays: number;
  booked: DateRange[];
  signedIn: boolean;
  // The renter's latest request on this listing.
  myRequest: MyRentalRequest | null;
};

export function RentalRequestPanel({ listingId, rates, minDays, booked, signedIn, myRequest }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, locale } = useDictionary();
  const r = t.rentals;
  const loginHref = localizePath(locale, `/login?next=${encodeURIComponent(pathname)}`);
  const [today] = useState(todayInRiyadh);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [state, formAction, pending] = useActionState<RentalRequestState, FormData>(
    sendRentalRequest.bind(null, listingId),
    {},
  );

  // The session may have expired since the page rendered.
  useEffect(() => {
    if (state.error === "signin") router.push(loginHref);
  }, [state.error, router, loginHref]);

  if (myRequest && (myRequest.status === "pending" || myRequest.status === "accepted")) {
    return (
      <div className="rounded-lg bg-mint px-3.5 py-3 text-sm">
        <p className="font-semibold text-ink">{r.yourRequest}</p>
        <p className="mt-0.5 text-ink/80">
          {fmt(r.dateRange, { start: formatDay(myRequest.startDate, locale), end: formatDay(myRequest.endDate, locale) })}
          {" · "}
          {count(locale, myRequest.days, r.days)}
          {" · "}
          {formatSAR(myRequest.quotedTotal, locale)}
        </p>
        <p className="mt-0.5 text-muted-foreground">
          {myRequest.status === "pending" ? r.waitingOwner : r.bookingConfirmed}
        </p>
        <Link href="/bookings" className="mt-1.5 inline-block text-xs font-semibold text-brand hover:underline">
          {r.myTitle}
        </Link>
      </div>
    );
  }

  if (state.sent) {
    return <p className="rounded-lg bg-mint px-3.5 py-3 text-sm text-ink">{r.requestSent}</p>;
  }

  const days = start && end ? rentalDays(start, end) : 0;
  const clash = days > 0 && overlapsAny({ start, end }, booked);
  const tooShort = days > 0 && days < minDays;
  const total = days > 0 ? quoteRental(rates, days) : null;
  const error = state.error && state.error !== "signin" ? state.error : null;

  return (
    <div className="flex flex-col gap-3">
      {myRequest?.status === "declined" && (
        <div className="rounded-lg bg-zinc-100 px-3.5 py-3 text-sm dark:bg-zinc-900">
          <p className="font-semibold text-ink dark:text-zinc-100">{r.requestDeclined}</p>
          <p className="mt-0.5 text-ink/80 dark:text-zinc-300">
            {fmt(r.dateRange, { start: formatDay(myRequest.startDate, locale), end: formatDay(myRequest.endDate, locale) })}
            {" · "}
            {count(locale, myRequest.days, r.days)}
            {" · "}
            {formatSAR(myRequest.quotedTotal, locale)}
          </p>
          {myRequest.declineReason && (
            <div className="mt-2">
              <p className="text-xs font-medium text-muted-foreground">{r.ownerReason}</p>
              <p className="mt-1 border-s-2 border-line ps-3 whitespace-pre-line text-ink/80 italic dark:border-zinc-700 dark:text-zinc-300">
                {myRequest.declineReason}
              </p>
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">{r.requestAgain}</p>
        </div>
      )}
      <form action={formAction} className="flex flex-col gap-3.5 rounded-lg border border-line p-3.5">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <CalendarCheck className="size-4 text-brand" aria-hidden />
            {r.requestTitle}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{r.requestIntro}</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rental-start" className="text-xs">
              {r.startDate}
            </Label>
            <Input
              id="rental-start"
              name="start"
              type="date"
              required
              min={today}
              max={addDays(today, MAX_RENTAL_DAYS)}
              value={start}
              onChange={(event) => {
                const value = event.target.value;
                setStart(value);
                // Keep the return date valid and at least the minimum stay away.
                if (value && (!end || end < value)) setEnd(addDays(value, Math.max(minDays, 1) - 1));
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rental-end" className="text-xs">
              {r.endDate}
            </Label>
            <Input
              id="rental-end"
              name="end"
              type="date"
              required
              min={start || today}
              max={addDays(start || today, MAX_RENTAL_DAYS - 1)}
              value={end}
              onChange={(event) => setEnd(event.target.value)}
            />
          </div>
        </div>

        {minDays > 1 && <p className="text-xs text-muted-foreground">{fmt(r.minDaysNote, { days: count(locale, minDays, r.days) })}</p>}

        {booked.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5 font-medium text-ink/80">
              <CalendarX className="size-3.5" aria-hidden />
              {r.bookedDates}
            </p>
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {booked.map((range) => (
                <li key={range.start} className="rounded-full bg-canvas px-2 py-0.5">
                  {fmt(r.dateRange, { start: formatDay(range.start, locale), end: formatDay(range.end, locale) })}
                </li>
              ))}
            </ul>
          </div>
        )}

        {total !== null && !clash && !tooShort && (
          <div className="flex items-baseline justify-between rounded-md bg-mint px-3 py-2 text-sm">
            <span className="text-ink/80">
              {r.estimatedTotal} · {count(locale, days, r.days)}
            </span>
            <span className="font-bold text-brand">{formatSAR(total, locale)}</span>
          </div>
        )}
        {clash && <p className="text-sm text-destructive">{r.errors.dates_unavailable}</p>}
        {tooShort && <p className="text-sm text-destructive">{r.errors.min_days_not_met}</p>}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rental-note" className="text-xs">
            {r.note}
          </Label>
          <Textarea
            id="rental-note"
            name="note"
            rows={2}
            maxLength={MAX_RENTAL_NOTE}
            placeholder={r.notePlaceholder}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {r.errors[error]}
            {error === "phone_required" && (
              <>
                {" "}
                <Link href="/account" className="font-medium underline">
                  {t.listingPage.offer.addPhone}
                </Link>
              </>
            )}
          </p>
        )}

        {signedIn ? (
          <Button type="submit" disabled={pending || days === 0 || clash || tooShort} className="h-11 text-label font-semibold">
            {pending ? r.sending : r.sendRequest}
          </Button>
        ) : (
          <Button type="button" onClick={() => router.push(loginHref)} className="h-11 text-label font-semibold">
            {r.signInToRequest}
          </Button>
        )}
      </form>
    </div>
  );
}
