import Image from "next/image";
import { CalendarCheck, CalendarDays, Hourglass, MessageCircle, Phone, Search } from "lucide-react";
import Link from "@/components/locale-link";
import { RiyalPrice } from "@/components/riyal-price";
import { listingName } from "@/lib/car-names";
import { count, fmt } from "@/lib/dictionary";
import type { Dictionary } from "@/lib/dictionaries";
import { formatDay, formatRelativeDays, whatsappUrl } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-server";
import { publicUrl } from "@/lib/r2";
import {
  getReceivedRentalRequests,
  getRentalContact,
  getSentRentalRequests,
  type RentalRequest,
  type RentalRequestStatus,
} from "@/lib/rentals";
import { absoluteUrl } from "@/lib/seo";
import { BookingActions } from "./booking-actions";

type Contact = { name: string | null; phone: string };
type Side = "owner" | "renter";

// Accepted requests carry the other party's number for the WhatsApp button.
async function withContacts(requests: RentalRequest[]): Promise<Map<string, Contact>> {
  const accepted = requests.filter((request) => request.status === "accepted");
  const results = await Promise.all(accepted.map((request) => getRentalContact(request.id)));
  const contacts = new Map<string, Contact>();
  results.forEach((result, i) => {
    if ("phone" in result) contacts.set(accepted[i].id, result);
  });
  return contacts;
}

// Owners see requests on their cars (Seller Center); renters see what they sent (/bookings).
export async function BookingsView({ userId, side }: { userId: string; side: Side }) {
  const { t, locale } = await getDictionary();
  const r = t.rentals;
  const requests = side === "owner" ? await getReceivedRentalRequests(userId) : await getSentRentalRequests(userId);
  const contacts = await withContacts(requests);

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{side === "owner" ? r.inboxTitle : r.myTitle}</h1>
        <span
          aria-hidden
          className="mt-3 block h-1 w-12 rounded-full bg-gradient-to-r from-brand to-lime rtl:bg-gradient-to-l"
        />
        <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">{side === "owner" ? r.inboxIntro : r.myIntro}</p>
      </div>

      {requests.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border-2 border-dashed border-line px-6 py-12 text-center dark:border-zinc-800">
          <span className="grid size-14 place-items-center rounded-full bg-mint text-brand dark:bg-lime/10 dark:text-lime">
            <CalendarDays className="size-7" aria-hidden />
          </span>
          <p className="mt-4 max-w-sm text-zinc-600 dark:text-zinc-400">
            {side === "owner" ? r.emptyReceived : r.emptySent}
          </p>
          <Link href="/rentals" className={`${ctaClass} mt-5`}>
            <Search className="size-4" aria-hidden />
            {r.browseRentals}
          </Link>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {requests.map((request) => (
            <RequestItem
              key={request.id}
              request={request}
              side={side}
              contact={contacts.get(request.id)}
              t={t}
              locale={locale}
            />
          ))}
        </ul>
      )}
    </>
  );
}

const ctaClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-brand to-forest px-5 text-sm font-semibold text-white shadow-md shadow-forest/25 transition-all hover:text-white hover:shadow-lg hover:shadow-forest/30 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:outline-none motion-safe:hover:-translate-y-px dark:focus-visible:ring-offset-zinc-950";

const STATUS_STYLES: Record<RentalRequestStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  accepted: "bg-mint text-brand dark:bg-lime/15 dark:text-lime",
  declined: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  cancelled: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  expired: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
};

const STATUS_EDGE: Record<RentalRequestStatus, string> = {
  pending: "border-s-amber-400",
  accepted: "border-s-brand dark:border-s-lime",
  declined: "border-s-zinc-300 dark:border-s-zinc-700",
  cancelled: "border-s-zinc-300 dark:border-s-zinc-700",
  expired: "border-s-zinc-300 dark:border-s-zinc-700",
};

function RequestItem({
  request,
  side,
  contact,
  t,
  locale,
}: {
  request: RentalRequest;
  side: Side;
  contact: Contact | undefined;
  t: Dictionary;
  locale: Locale;
}) {
  const r = t.rentals;
  const { listing } = request;
  const title = listing ? listingName(locale, listing, listing.year) : null;
  const otherName = request.otherName || (side === "owner" ? r.aRenter : r.theOwner);
  const live = listing?.status === "active";
  const settled = request.status !== "pending";
  const dates = fmt(r.dateRange, {
    start: formatDay(request.startDate, locale),
    end: formatDay(request.endDate, locale),
  });
  const statusChip = (
    <span
      className={`absolute start-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold shadow-sm ${STATUS_STYLES[request.status]}`}
    >
      {r.status[request.status]}
    </span>
  );

  return (
    <li
      className={`overflow-hidden rounded-2xl border-s-4 bg-card p-3 shadow-[0_2px_10px_rgba(20,30,25,.06)] ring-1 ring-black/5 sm:p-4 dark:ring-white/10 ${STATUS_EDGE[request.status]}`}
    >
      <div className="flex gap-3 sm:gap-4">
        {listing ? (
          <Link
            href={`/listings/${listing.id}`}
            className={`relative aspect-[4/3] w-28 shrink-0 self-start overflow-hidden rounded-xl bg-mint sm:w-40 dark:bg-zinc-800 ${settled ? "opacity-80" : ""}`}
          >
            {listing.imageKey && (
              <Image src={publicUrl(listing.imageKey)} alt="" fill sizes="(min-width: 640px) 160px, 112px" className="object-cover" />
            )}
            {statusChip}
          </Link>
        ) : (
          <div className="relative aspect-[4/3] w-28 shrink-0 self-start rounded-xl bg-mint sm:w-40 dark:bg-zinc-800">
            {statusChip}
          </div>
        )}

        <div className="min-w-0 flex-1">
          {listing && title ? (
            <Link
              href={`/listings/${listing.id}`}
              className="block truncate text-base font-semibold transition-colors hover:text-brand sm:text-lg dark:hover:text-lime"
            >
              {title}
            </Link>
          ) : (
            <p className="font-semibold text-muted-foreground">{r.listingGone}</p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">
            {fmt(side === "owner" ? r.from : r.owner, { name: otherName })}
            {" · "}
            {formatRelativeDays(request.createdAt, locale)}
          </p>

          <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-2 rounded-xl bg-canvas px-3 py-2.5 dark:bg-zinc-900">
            <div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" aria-hidden />
                {count(locale, request.days, r.days)}
              </p>
              <p className="text-sm font-semibold">{dates}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{r.estimatedTotal}</p>
              <p className="text-xl font-bold tracking-tight text-brand dark:text-lime">
                <RiyalPrice amount={request.quotedTotal} />
              </p>
            </div>
          </div>

          {request.note && (
            <p className="mt-3 border-s-2 border-line ps-3 text-sm whitespace-pre-line text-ink/80 italic dark:border-zinc-700 dark:text-zinc-300">
              {request.note}
            </p>
          )}

          {live && request.status === "pending" && side === "owner" && (
            <BookingActions requestId={request.id} side="owner" />
          )}
          {live && request.status === "pending" && side === "renter" && (
            <>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Hourglass className="size-4 shrink-0" aria-hidden />
                {r.waitingOwner}
              </p>
              <BookingActions requestId={request.id} side="renter" />
            </>
          )}
          {request.status === "accepted" && contact && (
            <AcceptedContact request={request} side={side} contact={contact} title={title} t={t} locale={locale} />
          )}
          {request.status === "accepted" && side === "renter" && (
            <BookingActions requestId={request.id} side="renter" accepted />
          )}
        </div>
      </div>
    </li>
  );
}

function AcceptedContact({
  request,
  side,
  contact,
  title,
  t,
  locale,
}: {
  request: RentalRequest;
  side: Side;
  contact: Contact;
  title: string | null;
  t: Dictionary;
  locale: Locale;
}) {
  const r = t.rentals;
  const text = fmt(side === "owner" ? r.ownerWhatsappText : r.renterWhatsappText, {
    name: contact.name || "",
    title: title ?? "",
    start: formatDay(request.startDate, locale),
    end: formatDay(request.endDate, locale),
    url: request.listing ? absoluteUrl(locale, `/listings/${request.listing.id}`) : "",
  });

  return (
    <div className="mt-3 rounded-xl bg-mint p-3 dark:bg-lime/10">
      <p className="flex items-center gap-2 text-sm font-medium text-forest dark:text-lime">
        <CalendarCheck className="size-4 shrink-0" aria-hidden />
        {r.bookingConfirmed}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={whatsappUrl(contact.phone, text)} target="_blank" rel="noopener noreferrer" className={ctaClass}>
          <MessageCircle className="size-4" aria-hidden />
          {side === "owner" ? r.whatsappRenter : r.whatsappOwner}
        </a>
        <a
          href={`tel:${contact.phone}`}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-semibold text-zinc-800 shadow-sm transition-colors hover:border-forest/30 hover:bg-forest/5 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          <Phone className="size-4" aria-hidden />
          {r.call}
          {" · "}
          <span dir="ltr">{contact.phone}</span>
        </a>
      </div>
    </div>
  );
}
