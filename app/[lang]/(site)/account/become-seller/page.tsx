import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import { Check, ChevronLeft, ChevronRight, Gift, ShieldCheck, Sparkles, Store, UserRound } from "lucide-react";
import Link from "@/components/locale-link";
import { requireUser } from "@/lib/auth";
import { fmt } from "@/lib/dictionary";
import { formatDay } from "@/lib/format";
import { launchFreeUntil } from "@/lib/launch";
import { DEALER_MONTHLY_LISTING_LIMIT, FREE_MONTHLY_LISTING_LIMIT } from "@/lib/plans";
import { becomeSeller } from "../actions";
import { DealerApplicationForm } from "../dealer-application/dealer-application-form";
import { ProfileForm } from "../profile-form";
import { getDictionary, localeRedirect } from "@/lib/i18n-server";
import { noIndex } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.account.becomeSellerPage.metaTitle, robots: noIndex };
}

export default async function BecomeSellerPage({
  searchParams,
}: PageProps<"/[lang]/account/become-seller">) {
  const { profile } = await requireUser("/account/become-seller");
  if (profile.role === "seller") return localeRedirect("/dashboard");
  const { type } = await searchParams;
  const { t, locale } = await getDictionary();
  const p = t.account.becomeSellerPage;
  const freeUntil = formatDay(launchFreeUntil(), locale);

  const individualPerks = [
    fmt(p.individualPerk1, { limit: FREE_MONTHLY_LISTING_LIMIT }),
    p.individualPerk2,
    p.individualPerk3,
  ];
  const dealerPerks = [
    fmt(p.dealerPerk1, { limit: DEALER_MONTHLY_LISTING_LIMIT }),
    p.dealerPerk2,
    p.dealerPerk3,
  ];

  if (type === "dealer" || type === "individual") {
    const dealer = type === "dealer";
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-12">
        <Link
          href="/account/become-seller"
          className="inline-flex items-center gap-1 rounded-full bg-white py-1.5 ps-2 pe-3.5 text-sm font-medium text-zinc-700 shadow-sm ring-1 ring-zinc-200 transition-colors hover:text-brand hover:ring-brand/40 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-800 dark:hover:text-lime dark:hover:ring-lime/40"
        >
          <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
          {p.backToType}
        </Link>
        <PageHeader
          icon={dealer ? Store : UserRound}
          eyebrow={dealer ? p.dealerTitle : p.individualTitle}
          title={dealer ? p.dealerHeading : p.individualHeading}
          intro={dealer ? p.dealerIntro : p.individualIntro}
          className="mt-6"
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <section className="min-w-0 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 sm:p-7 dark:bg-zinc-900 dark:ring-zinc-800">
            {dealer ? (
              <DealerApplicationForm profile={profile} freeUntil={freeUntil} />
            ) : (
              <ProfileForm profile={profile} action={becomeSeller} submitLabel={p.startSelling} />
            )}
          </section>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            <GradientCard>
              <p className="text-xs font-semibold tracking-wide text-lime uppercase">{p.perksTitle}</p>
              <PerkList perks={dealer ? dealerPerks : individualPerks} dark />
              {dealer && <FreePill text={fmt(p.freeUntil, { date: freeUntil })} />}
            </GradientCard>

            {dealer && (
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
                <p className="text-sm font-semibold tracking-tight">{p.howItWorksTitle}</p>
                <ol className="mt-4 flex flex-col gap-4">
                  {[p.dealerStep1, p.dealerStep2, p.dealerStep3].map((step, i) => (
                    <li key={step} className="flex items-start gap-3 text-sm">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-mint text-xs font-bold text-brand ring-1 ring-brand/15 dark:bg-lime/10 dark:text-lime dark:ring-lime/25">
                        {(i + 1).toLocaleString(locale === "ar" ? "ar-SA" : "en")}
                      </span>
                      <span className="pt-0.5 text-zinc-700 dark:text-zinc-300">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </aside>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-12">
      <PageHeader icon={Store} eyebrow={p.eyebrow} title={p.chooseHeading} intro={p.chooseIntro} />

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-6">
        <li className="flex">
          <Link
            href="/account/become-seller?type=individual"
            className="group flex w-full flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 transition-all hover:shadow-md hover:ring-brand/40 motion-safe:hover:-translate-y-0.5 sm:p-7 dark:bg-zinc-900 dark:ring-zinc-800 dark:hover:ring-lime/40"
          >
            <span className="grid size-12 place-items-center rounded-xl bg-mint text-brand dark:bg-lime/10 dark:text-lime">
              <UserRound className="size-6" aria-hidden />
            </span>
            <span className="mt-5 block text-xl font-semibold tracking-tight">{p.individualTitle}</span>
            <span className="mt-1.5 block text-sm text-zinc-600 dark:text-zinc-400">{p.individualDescription}</span>
            <PerkList perks={individualPerks} />
            <Cta label={p.continue} className="text-brand dark:text-lime" />
          </Link>
        </li>
        <li className="flex">
          <Link
            href="/account/become-seller?type=dealer"
            className="group relative flex w-full flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-forest via-forest to-brand p-5 text-white shadow-lg shadow-forest/20 ring-1 ring-transparent transition-all hover:shadow-xl hover:ring-lime/50 motion-safe:hover:-translate-y-0.5 sm:p-7"
          >
            <GradientDecor />
            <span className="relative flex items-start justify-between gap-3">
              <span className="grid size-12 place-items-center rounded-xl bg-lime/15 text-lime ring-1 ring-lime/40">
                <Store className="size-6" aria-hidden />
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-lime/15 px-2.5 py-1 text-xs font-semibold text-lime ring-1 ring-lime/40">
                <Sparkles className="size-3" aria-hidden />
                {p.recommended}
              </span>
            </span>
            <span className="relative mt-5 block text-xl font-semibold tracking-tight">{p.dealerTitle}</span>
            <span className="relative mt-1.5 block text-sm text-white/75">{p.dealerDescription}</span>
            <span className="relative">
              <PerkList perks={dealerPerks} dark />
              <FreePill text={fmt(p.freeUntil, { date: freeUntil })} />
            </span>
            <Cta label={p.continue} className="relative text-lime" />
          </Link>
        </li>
      </ul>

      <p className="mt-6 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <ShieldCheck className="size-4 shrink-0 text-brand dark:text-lime" aria-hidden />
        {p.switchLater}
      </p>
    </main>
  );
}

function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  intro,
  className = "",
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  intro: string;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-forest/5 px-2.5 py-1 text-xs font-semibold tracking-wide text-forest ring-1 ring-forest/15 dark:bg-lime/10 dark:text-lime dark:ring-lime/25">
        <Icon className="size-3.5" aria-hidden />
        {eyebrow}
      </span>
      <h1 className="mt-2.5 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <span
        aria-hidden
        className="mt-3 block h-1 w-12 rounded-full bg-gradient-to-r from-brand to-lime rtl:bg-gradient-to-l"
      />
      <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">{intro}</p>
    </div>
  );
}

function GradientDecor() {
  return (
    <>
      <span
        aria-hidden
        className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-lime/50 to-transparent"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -end-16 -top-16 size-56 rounded-full bg-lime/10 blur-3xl"
      />
    </>
  );
}

function GradientCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-forest via-forest to-brand p-5 text-white shadow-lg shadow-forest/20">
      <GradientDecor />
      <div className="relative">{children}</div>
    </div>
  );
}

function PerkList({ perks, dark = false }: { perks: string[]; dark?: boolean }) {
  return (
    <span className="mt-5 flex flex-col gap-2.5">
      {perks.map((perk) => (
        <span key={perk} className="flex items-start gap-2.5 text-sm">
          <span
            className={`mt-px grid size-5 shrink-0 place-items-center rounded-full ${
              dark ? "bg-lime/15 text-lime ring-1 ring-lime/40" : "bg-mint text-brand dark:bg-lime/10 dark:text-lime"
            }`}
          >
            <Check className="size-3" strokeWidth={3} aria-hidden />
          </span>
          <span className={dark ? "text-white/90" : "text-zinc-700 dark:text-zinc-300"}>{perk}</span>
        </span>
      ))}
    </span>
  );
}

function FreePill({ text }: { text: string }) {
  return (
    <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-lime px-3 py-1 text-xs font-bold text-forest">
      <Gift className="size-3.5" aria-hidden />
      {text}
    </span>
  );
}

function Cta({ label, className }: { label: string; className: string }) {
  return (
    <span className={`mt-auto inline-flex items-center gap-1 pt-6 text-sm font-semibold ${className}`}>
      {label}
      <ChevronRight
        className="size-4 transition-transform rtl:rotate-180 motion-safe:group-hover:translate-x-0.5 motion-safe:rtl:group-hover:-translate-x-0.5"
        aria-hidden
      />
    </span>
  );
}
