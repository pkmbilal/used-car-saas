import type { Metadata } from "next";
import Image from "next/image";
import { MessageCircle, Phone } from "lucide-react";
import Link from "@/components/locale-link";
import { RiyalPrice } from "@/components/riyal-price";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { carName } from "@/lib/car-names";
import { fmt } from "@/lib/dictionary";
import type { Dictionary } from "@/lib/dictionaries";
import { formatRelativeDays, formatSAR, whatsappUrl } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-server";
import { getOfferContact, getReceivedOffers, getSentOffers, type Offer, type OfferStatus } from "@/lib/offers";
import { publicUrl } from "@/lib/r2";
import { absoluteUrl, noIndex } from "@/lib/seo";
import { OfferActions } from "./offer-actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.offers.metaTitle, robots: noIndex };
}

type Contact = { name: string | null; phone: string };

// Accepted offers carry the other party's number for the WhatsApp button.
async function withContacts(offers: Offer[]): Promise<Map<string, Contact>> {
  const accepted = offers.filter((offer) => offer.status === "accepted");
  const results = await Promise.all(accepted.map((offer) => getOfferContact(offer.id)));
  const contacts = new Map<string, Contact>();
  results.forEach((result, i) => {
    if ("phone" in result) contacts.set(accepted[i].id, result);
  });
  return contacts;
}

export default async function OffersPage() {
  const { user } = await requireUser("/offers");
  const { t, locale } = await getDictionary();
  const [received, sent] = await Promise.all([getReceivedOffers(user.id), getSentOffers(user.id)]);
  const contacts = await withContacts([...received, ...sent]);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">{t.offers.title}</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t.offers.intro}</p>

      <OfferSection title={t.offers.received} empty={t.offers.emptyReceived} t={t}>
        {received.map((offer) => (
          <OfferItem key={offer.id} offer={offer} side="seller" contact={contacts.get(offer.id)} t={t} locale={locale} />
        ))}
      </OfferSection>

      <OfferSection title={t.offers.sent} empty={t.offers.emptySent} t={t}>
        {sent.map((offer) => (
          <OfferItem key={offer.id} offer={offer} side="buyer" contact={contacts.get(offer.id)} t={t} locale={locale} />
        ))}
      </OfferSection>
    </main>
  );
}

function OfferSection({
  title,
  empty,
  t,
  children,
}: {
  title: string;
  empty: string;
  t: Dictionary;
  children: React.ReactNode[];
}) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          {empty}{" "}
          <Link href="/listings" className="font-medium underline">
            {t.offers.browseCars}
          </Link>
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">{children}</ul>
      )}
    </section>
  );
}

const STATUS_STYLES: Record<OfferStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  countered: "bg-sky-100 text-sky-800",
  accepted: "bg-mint text-brand",
  declined: "bg-zinc-100 text-zinc-600",
  withdrawn: "bg-zinc-100 text-zinc-600",
  expired: "bg-zinc-100 text-zinc-600",
};

function OfferItem({
  offer,
  side,
  contact,
  t,
  locale,
}: {
  offer: Offer;
  side: "seller" | "buyer";
  contact: Contact | undefined;
  t: Dictionary;
  locale: Locale;
}) {
  const o = t.offers;
  const { listing } = offer;
  const title = listing ? carName(locale, listing.make, listing.model, listing.year) : null;
  const otherName = offer.otherName || (side === "seller" ? o.aBuyer : o.theSeller);
  // Only open offers on a live listing can still be answered.
  const live = listing?.status === "active";
  const amountLabel = offer.status === "accepted" ? o.agreed : o.offered;

  return (
    <li className="overflow-hidden rounded-2xl bg-card p-3 shadow-[0_2px_10px_rgba(20,30,25,.06)] ring-1 ring-black/5 sm:p-4 dark:ring-white/10">
      <div className="flex gap-3 sm:gap-4">
        {listing ? (
          <Link
            href={`/listings/${listing.id}`}
            className="relative aspect-[4/3] w-24 shrink-0 self-start overflow-hidden rounded-xl bg-mint sm:w-32 dark:bg-zinc-800"
          >
            {listing.imageKey && (
              <Image src={publicUrl(listing.imageKey)} alt="" fill sizes="(min-width: 640px) 128px, 96px" className="object-cover" />
            )}
          </Link>
        ) : (
          <div className="aspect-[4/3] w-24 shrink-0 rounded-xl bg-mint sm:w-32 dark:bg-zinc-800" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[offer.status]}`}>
              {o.status[offer.status]}
            </span>
            <span className="text-xs text-muted-foreground">{formatRelativeDays(offer.createdAt, locale)}</span>
          </div>
          {listing && title ? (
            <Link href={`/listings/${listing.id}`} className="mt-1.5 block truncate font-semibold hover:text-brand">
              {title}
            </Link>
          ) : (
            <p className="mt-1.5 font-semibold text-muted-foreground">{o.listingGone}</p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">
            {fmt(side === "seller" ? o.from : o.seller, { name: otherName })}
            {listing && (
              <>
                {" · "}
                {fmt(o.asking, { price: formatSAR(listing.price, locale) })}
              </>
            )}
          </p>

          <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">{amountLabel}</dt>
              <dd className="font-bold text-brand">
                <RiyalPrice amount={offer.amount} />
              </dd>
            </div>
            {offer.status === "countered" && offer.counterAmount !== null && (
              <div>
                <dt className="text-xs text-muted-foreground">{side === "seller" ? o.yourCounter : o.sellerCounter}</dt>
                <dd className="font-bold">
                  <RiyalPrice amount={offer.counterAmount} />
                </dd>
              </div>
            )}
          </dl>
          {offer.note && (
            <p className="mt-2 rounded-lg bg-canvas px-3 py-2 text-sm whitespace-pre-line text-ink">{offer.note}</p>
          )}

          {live && offer.status === "pending" && side === "seller" && (
            <OfferActions offerId={offer.id} side="seller" amount={offer.amount} askingPrice={listing.price} counterAmount={null} />
          )}
          {live && offer.status === "pending" && side === "buyer" && (
            <>
              <p className="mt-3 text-sm text-muted-foreground">{o.waitingSeller}</p>
              <OfferActions offerId={offer.id} side="buyer" amount={offer.amount} askingPrice={null} counterAmount={null} />
            </>
          )}
          {live && offer.status === "countered" && side === "seller" && (
            <p className="mt-3 text-sm text-muted-foreground">{o.waitingBuyer}</p>
          )}
          {live && offer.status === "countered" && side === "buyer" && (
            <OfferActions
              offerId={offer.id}
              side="buyer"
              amount={offer.amount}
              askingPrice={null}
              counterAmount={offer.counterAmount}
            />
          )}
          {offer.status === "accepted" && contact && (
            <AcceptedContact offer={offer} side={side} contact={contact} title={title} t={t} locale={locale} />
          )}
        </div>
      </div>
    </li>
  );
}

function AcceptedContact({
  offer,
  side,
  contact,
  title,
  t,
  locale,
}: {
  offer: Offer;
  side: "seller" | "buyer";
  contact: Contact;
  title: string | null;
  t: Dictionary;
  locale: Locale;
}) {
  const o = t.offers;
  const text = fmt(side === "seller" ? o.sellerWhatsappText : o.buyerWhatsappText, {
    name: contact.name || "",
    amount: formatSAR(offer.amount, locale),
    title: title ?? "",
    url: offer.listing ? absoluteUrl(locale, `/listings/${offer.listing.id}`) : "",
  });

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Button asChild size="sm">
        <a href={whatsappUrl(contact.phone, text)} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="size-4" />
          {side === "seller" ? o.whatsappBuyer : o.whatsappSeller}
        </a>
      </Button>
      <Button asChild size="sm" variant="outline">
        <a href={`tel:${contact.phone}`}>
          <Phone className="size-4" />
          {/* Phone numbers read left to right on Arabic pages too. */}
          {o.call}
          {" · "}
          <span dir="ltr">{contact.phone}</span>
        </a>
      </Button>
    </div>
  );
}
