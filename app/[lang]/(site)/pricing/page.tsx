import type { Metadata } from "next";
import { PlusCircle, Sparkles, type LucideIcon } from "lucide-react";
import { getCurrentUser, type Profile } from "@/lib/auth";
import { getLatestDealerApplication } from "@/lib/dealer-application";
import { salesWhatsappUrl } from "@/lib/contact";
import type { Dictionary } from "@/lib/dictionaries";
import { getDictionary } from "@/lib/i18n-server";
import { fmt } from "@/lib/dictionary";
import { formatSAR } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { addonPrice, getListingQuota, PLAN_DETAILS, PLANS, type Plan } from "@/lib/plans";
import { PricingFaq } from "./faq";
import { PlanCard, type PlanCta } from "./plan-card";
import { UsageBanner } from "./usage-banner";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return pageMetadata({ title: t.pricing.metaTitle, description: t.pricing.metaDescription, path: "/pricing" });
}

function signupHref(next: string): string {
  return `/signup?next=${encodeURIComponent(next)}`;
}

// Billing isn't wired up, so upgrades go through the dealer application and a
// moderator grants the plan.
function planCta(
  t: Dictionary,
  plan: Plan,
  profile: Pick<Profile, "role" | "plan"> | null,
  applicationPending: boolean,
): PlanCta {
  const isFree = plan === "free";

  if (!profile) {
    return {
      label: t.pricing.signUp,
      href: signupHref(isFree ? "/account/become-seller" : `/account/become-seller?type=dealer&plan=${plan}`),
    };
  }

  const isSeller = profile.role === "seller";
  if (isFree && !isSeller) {
    return { label: t.pricing.startSelling, href: "/account/become-seller?type=individual" };
  }
  if (plan === profile.plan) return { label: t.pricing.currentPlan, disabled: true };
  if (PLANS.indexOf(plan) < PLANS.indexOf(profile.plan)) return null;
  if (applicationPending) return { label: t.pricing.underReview, disabled: true };

  return {
    label: t.pricing.upgrade,
    href: isSeller
      ? `/account/dealer-application?plan=${plan}`
      : `/account/become-seller?type=dealer&plan=${plan}`,
  };
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
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {PLANS.map((plan) => (
            <li key={plan}>
              <PlanCard
                plan={plan}
                details={PLAN_DETAILS[plan]}
                cta={planCta(t, plan, current?.profile ?? null, applicationPending)}
              />
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

// One-off purchases for sellers who don't need a whole plan.
function Addons({ t, locale }: { t: Dictionary; locale: Locale }) {
  const a = t.addons;
  const items: { icon: LucideIcon; title: string; text: string; price: number }[] = [
    { icon: Sparkles, title: a.boostTitle, text: a.boostText, price: addonPrice("featured_boost") },
    { icon: PlusCircle, title: a.extraTitle, text: a.extraText, price: addonPrice("extra_listings") },
  ];

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold tracking-tight">{a.pricingTitle}</h2>
      <p className="mt-1 max-w-2xl text-label text-muted-foreground">{a.pricingIntro}</p>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {items.map(({ icon: Icon, title, text, price }) => (
          <li
            key={title}
            className="flex gap-4 rounded-lg bg-white p-5 shadow-[0_2px_10px_rgba(20,30,25,.05)]"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-mint text-brand">
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-semibold">{title}</p>
              <p className="mt-1 text-label text-muted-foreground">{text}</p>
              <p className="mt-2 text-sm font-semibold text-brand">
                {fmt(a.perListing, { price: formatSAR(price, locale) })}{" "}
                <span className="font-normal text-muted-foreground">{a.plusVat}</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
