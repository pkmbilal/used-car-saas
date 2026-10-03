import type { Metadata } from "next";
import { getCurrentUser, type Profile } from "@/lib/auth";
import { getLatestDealerApplication } from "@/lib/dealer-application";
import { getListingQuota, PLAN_DETAILS, PLANS, type Plan } from "@/lib/plans";
import { PricingFaq } from "./faq";
import { PlanCard, type PlanCta } from "./plan-card";
import { UsageBanner } from "./usage-banner";

export const metadata: Metadata = {
  title: "Pricing | DriveLoop",
  description: "Plans for private sellers and car dealers on DriveLoop.",
};

function signupHref(next: string): string {
  return `/signup?next=${encodeURIComponent(next)}`;
}

// Billing isn't wired up, so upgrades go through the dealer application and a
// moderator grants the plan.
function planCta(
  plan: Plan,
  profile: Pick<Profile, "role" | "plan"> | null,
  applicationPending: boolean,
): PlanCta {
  const isFree = plan === "free";

  if (!profile) {
    return {
      label: "Sign up",
      href: signupHref(isFree ? "/account/become-seller" : `/account/become-seller?type=dealer&plan=${plan}`),
    };
  }

  const isSeller = profile.role === "seller";
  if (isFree && !isSeller) {
    return { label: "Start selling", href: "/account/become-seller?type=individual" };
  }
  if (plan === profile.plan) return { label: "Current plan", disabled: true };
  if (PLANS.indexOf(plan) < PLANS.indexOf(profile.plan)) return null;
  if (applicationPending) return { label: "Application under review", disabled: true };

  return {
    label: "Upgrade",
    href: isSeller
      ? `/account/dealer-application?plan=${plan}`
      : `/account/become-seller?type=dealer&plan=${plan}`,
  };
}

export default async function PricingPage() {
  const current = await getCurrentUser();
  const [latest, quota] = current
    ? await Promise.all([
        getLatestDealerApplication(current.user.id),
        current.profile.role === "seller" ? getListingQuota() : null,
      ])
    : [null, null];
  const applicationPending = latest?.status === "pending";

  return (
    <main className="light bg-canvas text-ink">
      <section className="relative overflow-hidden bg-charcoal">
        <div className="absolute inset-y-0 right-0 w-2/3 bg-[radial-gradient(ellipse_at_70%_60%,rgba(111,224,124,.16),transparent_60%)]" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-10 pb-14 sm:px-6">
          <p className="text-[0.65625rem] font-bold tracking-[0.24em] text-[#5fd06e]">PRICING</p>
          <h1 className="mt-2.5 max-w-md text-3xl leading-tight font-medium tracking-tight text-white md:text-4xl">
            Plans For <span className="text-lime">Every Seller</span>
          </h1>
          <p className="mt-3.5 max-w-sm text-[0.78125rem] leading-relaxed text-white/85">
            List your car for free, or grow your showroom with a dealer plan.
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
                cta={planCta(plan, current?.profile ?? null, applicationPending)}
              />
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Prices are in Saudi Riyals.
        </p>
        <PricingFaq />
      </div>
    </main>
  );
}
