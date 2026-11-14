import type { Metadata } from "next";
import { CalendarClock, Sparkles } from "lucide-react";
import { getCurrentUser, type Profile } from "@/lib/auth";
import { getLatestDealerApplication } from "@/lib/dealer-application";
import { salesWhatsappUrl } from "@/lib/contact";
import type { Dictionary } from "@/lib/dictionaries";
import { getDictionary } from "@/lib/i18n-server";
import { fmt } from "@/lib/dictionary";
import { formatDay, formatSAR } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { launchFreeUntil } from "@/lib/launch";
import {
  addonPrice,
  DEALER_MONTHLY_LISTING_LIMIT,
  FREE_MONTHLY_LISTING_LIMIT,
  getListingQuota,
  isDealerPlan,
  PHOTO_LIMIT_PER_LISTING,
} from "@/lib/plans";
import { PricingFaq } from "./faq";
import { PlanCard, type PlanCardProps, type PlanCta } from "./plan-card";
import { UsageBanner } from "./usage-banner";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return pageMetadata({ title: t.pricing.metaTitle, description: t.pricing.metaDescription, path: "/pricing" });
}

function signupHref(next: string): string {
  return `/signup?next=${encodeURIComponent(next)}`;
}

type ViewerProfile = Pick<Profile, "role" | "plan"> | null;

function freeCta(t: Dictionary, profile: ViewerProfile): PlanCta {
  if (!profile) return { label: t.pricing.signUp, href: signupHref("/account/become-seller") };
  if (profile.role !== "seller") {
    return { label: t.pricing.startSelling, href: "/account/become-seller?type=individual" };
  }
  return profile.plan === "free" ? { label: t.pricing.currentPlan, disabled: true } : null;
}

// Free during launch: an admin approves the CR and grants 'dealer', no payment.
function dealerCta(t: Dictionary, profile: ViewerProfile, applicationPending: boolean): PlanCta {
  if (!profile) return { label: t.pricing.signUp, href: signupHref("/account/become-seller?type=dealer") };
  if (isDealerPlan(profile.plan)) return { label: t.pricing.currentPlan, disabled: true };
  if (applicationPending) return { label: t.pricing.underReview, disabled: true };
  return {
    label: t.pricing.applyDealer,
    href: profile.role === "seller" ? "/account/dealer-application" : "/account/become-seller?type=dealer",
  };
}

function tiers(
  t: Dictionary,
  freeUntil: string,
  profile: ViewerProfile,
  applicationPending: boolean,
): (PlanCardProps & { key: string })[] {
  const p = t.pricing.tiers;
  const limits = (listings: number) => (feature: string) =>
    fmt(feature, { listings, photos: PHOTO_LIMIT_PER_LISTING });

  return [
    {
      key: "free",
      name: p.free.name,
      tagline: p.free.tagline,
      price: p.free.price,
      features: p.free.features.map(limits(FREE_MONTHLY_LISTING_LIMIT)),
      cta: freeCta(t, profile),
    },
    {
      key: "dealer",
      name: p.dealer.name,
      tagline: p.dealer.tagline,
      price: p.dealer.price,
      priceNote: fmt(p.dealer.priceNote, { date: freeUntil }),
      badge: p.dealer.badge,
      features: p.dealer.features.map(limits(DEALER_MONTHLY_LISTING_LIMIT)),
      highlighted: true,
      cta: dealerCta(t, profile, applicationPending),
    },
    {
      key: "tools",
      name: p.tools.name,
      tagline: p.tools.tagline,
      price: p.tools.price,
      badge: t.pricing.comingSoon,
      features: p.tools.features,
      comingSoon: true,
      cta: null,
    },
  ];
}

export default async function PricingPage() {
  const { t, locale } = await getDictionary();
  const current = await getCurrentUser();
  const [latest, quota] = current
    ? await Promise.all([
        getLatestDealerApplication(current.user.id),
        current.profile.role === "seller" ? getListingQuota() : null,
      ])
    : [null, null];
  const applicationPending = latest?.status === "pending";
  const salesUrl = salesWhatsappUrl(t.pricing.salesMessage);
  const freeUntil = formatDay(launchFreeUntil(), locale);

  return (
    <main className="light bg-canvas text-ink">
      <section className="relative overflow-hidden bg-charcoal">
        <div className="absolute inset-y-0 end-0 w-2/3 bg-[radial-gradient(ellipse_at_70%_60%,rgba(111,224,124,.16),transparent_60%)] rtl:bg-[radial-gradient(ellipse_at_30%_60%,rgba(111,224,124,.16),transparent_60%)]" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-10 pb-14 sm:px-6">
          <p className="text-eyebrow font-bold tracking-[0.24em] text-[#5fd06e]">{t.pricing.eyebrow}</p>
          <h1 className="mt-2.5 max-w-md text-3xl leading-tight font-medium tracking-tight text-white md:text-4xl">
            {t.pricing.titleStart} <span className="text-lime">{t.pricing.titleHighlight}</span>
          </h1>
          <p className="mt-3.5 max-w-sm text-label leading-relaxed text-white/85">
            {t.pricing.intro}
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        {quota && (
          <div className="mb-8">
            <UsageBanner quota={quota} applicationPending={applicationPending} />
          </div>
        )}
        <p className="mb-6 flex items-start gap-2.5 rounded-lg bg-mint px-4 py-3 text-label font-medium text-forest">
          <CalendarClock className="mt-0.5 size-4 shrink-0" aria-hidden />
          {fmt(t.pricing.launchNote, { date: freeUntil })}
        </p>
        <ul className="grid gap-4 md:grid-cols-3 lg:gap-5">
          {tiers(t, freeUntil, current?.profile ?? null, applicationPending).map(({ key, ...tier }) => (
            <li key={key}>
              <PlanCard {...tier} />
            </li>
          ))}
        </ul>
        <Addons t={t} locale={locale} />
        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t.pricing.vatNote}
          {salesUrl && (
            <>
              {" "}
              {t.pricing.questions}{" "}
              <a href={salesUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand underline">
                {t.pricing.talkToSales}
              </a>
            </>
          )}
        </p>
        <PricingFaq salesUrl={salesUrl} />
      </div>
    </main>
  );
}

// The Featured Boost: the only paid item during launch. Extra listings are
// still in the database (addon_requests) but no longer sold.
function Addons({ t, locale }: { t: Dictionary; locale: Locale }) {
  const a = t.addons;

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold tracking-tight">{a.pricingTitle}</h2>
      <p className="mt-1 max-w-2xl text-label text-muted-foreground">{a.pricingIntro}</p>
      <div className="mt-4 flex max-w-xl gap-4 rounded-lg bg-white p-5 shadow-[0_2px_10px_rgba(20,30,25,.05)]">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-mint text-brand">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-semibold">{a.boostTitle}</p>
          <p className="mt-1 text-label text-muted-foreground">{a.boostText}</p>
          <p className="mt-2 text-sm font-semibold text-brand">
            {fmt(a.perListing, { price: formatSAR(addonPrice("featured_boost"), locale) })}{" "}
            <span className="font-normal text-muted-foreground">{a.plusVat}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
