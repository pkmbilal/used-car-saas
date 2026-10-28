import type { Metadata } from "next";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { HandCoins, Handshake, Hourglass, Inbox, MessageCircle, Phone, Search } from "lucide-react";
import Link from "@/components/locale-link";
import { RiyalPrice } from "@/components/riyal-price";
import { requireUser } from "@/lib/auth";
import { carName } from "@/lib/car-names";
import { count, fmt } from "@/lib/dictionary";
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
type Tab = "received" | "sent";

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

// Open offers only count while the listing is still live.
function countLive(offers: Offer[], status: OfferStatus) {
  return offers.filter((offer) => offer.status === status && offer.listing?.status === "active").length;
}

export default async function OffersPage({ searchParams }: PageProps<"/[lang]/offers">) {
  const { user } = await requireUser("/offers");
  const { t, locale } = await getDictionary();
  const o = t.offers;
  const [received, sent] = await Promise.all([getReceivedOffers(user.id), getSentOffers(user.id)]);
  const contacts = await withContacts([...received, ...sent]);

  const tabParam = (await searchParams).tab;
  // Buyers who have never received an offer land on what they sent.
  const tab: Tab =
    tabParam === "sent" || (tabParam !== "received" && received.length === 0 && sent.length > 0)
      ? "sent"
      : "received";
  const offers = tab === "sent" ? sent : received;
  const side = tab === "sent" ? "buyer" : "seller";

  const toAnswer = countLive(received, "pending") + countLive(sent, "countered");
  const waiting = countLive(received, "countered") + countLive(sent, "pending");
  const deals = [...received, ...sent].filter((offer) => offer.status === "accepted").length;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-12">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-forest/5 px-2.5 py-1 text-xs font-semibold tracking-wide text-forest ring-1 ring-forest/15 dark:bg-lime/10 dark:text-lime dark:ring-lime/25">
          <span className="size-1.5 rounded-full bg-brand dark:bg-lime" aria-hidden />
          {toAnswer > 0 ? count(locale, toAnswer, o.toAnswerCount) : o.title}
        </span>
        <h1 className="mt-2.5 text-3xl font-bold tracking-tight sm:text-4xl">{o.title}</h1>
        <span
          aria-hidden
          className="mt-3 block h-1 w-12 rounded-full bg-gradient-to-r from-brand to-lime rtl:bg-gradient-to-l"
        />
        <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">{o.intro}</p>
      </div>

      <section className="relative mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-forest via-forest to-brand p-3 text-white shadow-lg shadow-forest/20 sm:p-5">
        <span
          aria-hidden
          className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-lime/50 to-transparent"
        />
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <StatTile icon={Inbox} label={o.statToAnswer} value={toAnswer} highlight={toAnswer > 0} />
          <StatTile icon={Hourglass} label={o.statWaiting} value={waiting} />
          <StatTile icon={Handshake} label={o.statDeals} value={deals} />
        </div>
      </section>

      <div className="mt-8 flex">
        <div className="inline-flex gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700">
          <TabLink href="/offers?tab=received" label={o.received} total={received.length} active={tab === "received"} />
          <TabLink href="/offers?tab=sent" label={o.sent} total={sent.length} active={tab === "sent"} />
        </div>
      </div>

      {offers.length === 0 ? (
        <EmptyOffers text={tab === "sent" ? o.emptySent : o.emptyReceived} t={t} />
      ) : (
        <ul className="mt-5 flex flex-col gap-4">
          {offers.map((offer) => (
            <OfferItem key={offer.id} offer={offer} side={side} contact={contacts.get(offer.id)} t={t} locale={locale} />
          ))}
        </ul>
      )}
    </main>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-2.5 ring-1 backdrop-blur-sm sm:p-3 ${
        highlight ? "bg-lime/15 ring-lime/40" : "bg-white/[0.07] ring-white/15"
      }`}
    >
      <p className="flex items-center gap-1.5 text-xs text-white/70">
        <Icon className={`size-3.5 shrink-0 ${highlight ? "text-lime" : ""}`} aria-hidden />
        <span className="truncate">{label}</span>
      </p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</p>
    </div>
  );
}

function TabLink({ href, label, total, active }: { href: string; label: string; total: number; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${
        active
          ? "bg-zinc-900 text-white hover:text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:text-zinc-900"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      }`}
    >
      {label}
      <span
        className={`min-w-5 rounded-full px-1.5 py-px text-center text-xs tabular-nums ${
          active ? "bg-white/20 dark:bg-zinc-900/15" : "bg-zinc-100 dark:bg-zinc-800"
        }`}
      >
        {total}
      </span>
    </Link>
  );
}

const ctaClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-brand to-forest px-5 text-sm font-semibold text-white shadow-md shadow-forest/25 transition-all hover:text-white hover:shadow-lg hover:shadow-forest/30 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:outline-none motion-safe:hover:-translate-y-px dark:focus-visible:ring-offset-zinc-950";

function EmptyOffers({ text, t }: { text: string; t: Dictionary }) {
  return (
    <div className="mt-5 flex flex-col items-center rounded-2xl border-2 border-dashed border-line px-6 py-12 text-center dark:border-zinc-800">
      <span className="grid size-14 place-items-center rounded-full bg-mint text-brand dark:bg-lime/10 dark:text-lime">
        <HandCoins className="size-7" aria-hidden />
      </span>
      <p className="mt-4 max-w-sm text-zinc-600 dark:text-zinc-400">{text}</p>
      <Link href="/listings" className={`${ctaClass} mt-5`}>
        <Search className="size-4" aria-hidden />
        {t.offers.browseCars}
      </Link>
    </div>
  );
}

const STATUS_STYLES: Record<OfferStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  countered: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  accepted: "bg-mint text-brand dark:bg-lime/15 dark:text-lime",
  declined: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  withdrawn: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  expired: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
};

// Start-edge colour strip so open and settled offers scan apart.
const STATUS_EDGE: Record<OfferStatus, string> = {
  pending: "border-s-amber-400",
  countered: "border-s-sky-400",
  accepted: "border-s-brand dark:border-s-lime",
  declined: "border-s-zinc-300 dark:border-s-zinc-700",
  withdrawn: "border-s-zinc-300 dark:border-s-zinc-700",
  expired: "border-s-zinc-300 dark:border-s-zinc-700",
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
  const settled = !["pending", "countered"].includes(offer.status);
  const amountLabel = offer.status === "accepted" ? o.agreed : o.offered;
  const below = listing && listing.price > 0 ? Math.round((1 - offer.amount / listing.price) * 100) : 0;
  const statusChip = (
    <span
      className={`absolute start-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold shadow-sm ${STATUS_STYLES[offer.status]}`}
    >
      {o.status[offer.status]}
    </span>
  );

  return (
    <li
      className={`overflow-hidden rounded-2xl border-s-4 bg-card p-3 shadow-[0_2px_10px_rgba(20,30,25,.06)] ring-1 ring-black/5 transition-all hover:shadow-[0_8px_24px_rgba(20,30,25,.10)] motion-safe:hover:-translate-y-px sm:p-4 dark:ring-white/10 ${STATUS_EDGE[offer.status]}`}
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
            <p className="font-semibold text-muted-foreground">{o.listingGone}</p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">
            {fmt(side === "seller" ? o.from : o.seller, { name: otherName })}
            {" · "}
            {formatRelativeDays(offer.createdAt, locale)}
          </p>

          <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-2 rounded-xl bg-canvas px-3 py-2.5 dark:bg-zinc-900">
            <div>
              <p className="text-xs text-muted-foreground">{amountLabel}</p>
              <p className="text-xl font-bold tracking-tight text-brand dark:text-lime">
                <RiyalPrice amount={offer.amount} />
              </p>
            </div>
            {offer.status === "countered" && offer.counterAmount !== null && (
              <div>
                <p className="text-xs text-muted-foreground">{side === "seller" ? o.yourCounter : o.sellerCounter}</p>
                <p className="text-xl font-bold tracking-tight text-sky-700 dark:text-sky-300">
                  <RiyalPrice amount={offer.counterAmount} />
                </p>
              </div>
            )}
            {listing && (
              <div className="flex flex-col items-start gap-1 text-xs text-muted-foreground">
                <span>{fmt(o.asking, { price: formatSAR(listing.price, locale) })}</span>
                {below > 0 && (
                  <span className="rounded-full bg-white px-2 py-0.5 font-medium text-ink ring-1 ring-line dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700">
                    {fmt(o.belowAsking, { pct: below })}
                  </span>
                )}
              </div>
            )}
          </div>

          {offer.note && (
            <p className="mt-3 border-s-2 border-line ps-3 text-sm whitespace-pre-line text-ink/80 italic dark:border-zinc-700 dark:text-zinc-300">
              {offer.note}
            </p>
          )}

          {live && offer.status === "pending" && side === "seller" && (
            <OfferActions offerId={offer.id} side="seller" amount={offer.amount} askingPrice={listing.price} counterAmount={null} />
          )}
          {live && offer.status === "pending" && side === "buyer" && (
            <>
              <WaitingNote text={o.waitingSeller} />
              <OfferActions offerId={offer.id} side="buyer" amount={offer.amount} askingPrice={null} counterAmount={null} />
            </>
          )}
          {live && offer.status === "countered" && side === "seller" && <WaitingNote text={o.waitingBuyer} />}
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

function WaitingNote({ text }: { text: string }) {
  return (
    <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
      <Hourglass className="size-4 shrink-0" aria-hidden />
      {text}
    </p>
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
    <div className="mt-3 rounded-xl bg-mint p-3 dark:bg-lime/10">
      <p className="flex items-center gap-2 text-sm font-medium text-forest dark:text-lime">
        <Handshake className="size-4 shrink-0" aria-hidden />
        {o.dealDone}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={whatsappUrl(contact.phone, text)} target="_blank" rel="noopener noreferrer" className={ctaClass}>
          <MessageCircle className="size-4" aria-hidden />
          {side === "seller" ? o.whatsappBuyer : o.whatsappSeller}
        </a>
        <a
          href={`tel:${contact.phone}`}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-semibold text-zinc-800 shadow-sm transition-colors hover:border-forest/30 hover:bg-forest/5 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          <Phone className="size-4" aria-hidden />
          {/* Phone numbers read left to right on Arabic pages too. */}
          {o.call}
          {" · "}
          <span dir="ltr">{contact.phone}</span>
        </a>
      </div>
    </div>
  );
}
