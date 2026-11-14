import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  CalendarDays,
  Car,
  ChevronRight,
  Crown,
  MapPin,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
} from "lucide-react";
import Link from "@/components/locale-link";
import { Avatar } from "@/components/avatar";
import { VerificationBadges } from "@/components/verification-badges";
import { requireUser } from "@/lib/auth";
import { cityName, fmt } from "@/lib/dictionary";
import { formatMonthYear } from "@/lib/format";
import { getDictionary } from "@/lib/i18n-server";
import { isDealerPlan } from "@/lib/plans";
import { publicUrl } from "@/lib/r2";
import { updateProfile } from "./actions";
import { AvatarUploader } from "./avatar-uploader";
import { ProfileForm } from "./profile-form";
import { noIndex } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.account.metaTitle, robots: noIndex };
}

type Step = { href: string; icon: LucideIcon; title: string; description: string };

export default async function AccountPage({ searchParams }: PageProps<"/[lang]/account">) {
  const { user, profile } = await requireUser("/account");
  const welcome = (await searchParams).welcome === "1";
  const { t, locale } = await getDictionary();
  const a = t.account;

  const avatarUrl = profile.avatar_key ? publicUrl(profile.avatar_key) : null;
  const isSeller = profile.role === "seller";
  const dealer = isSeller && isDealerPlan(profile.plan);
  const memberSince = formatMonthYear(profile.created_at, locale);

  const steps: Step[] = [];
  if (dealer) {
    steps.push({ href: "/dashboard/storefront", icon: Store, title: a.editStorefront, description: a.storefrontDesc });
  }
  if (isSeller && profile.plan === "free") {
    steps.push({ href: "/pricing", icon: Crown, title: a.seeDealerPlans, description: a.plansDesc });
  }
  if (isSeller && !profile.id_verified_at) {
    steps.push({ href: "/account/verification", icon: ShieldCheck, title: a.getVerified, description: a.verifyDesc });
  }
  if (!isSeller) {
    steps.push({ href: "/account/become-seller", icon: Car, title: a.becomeSeller, description: a.sellDesc });
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-12">
      <div className="min-w-0">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-forest/5 px-2.5 py-1 text-xs font-semibold tracking-wide text-forest ring-1 ring-forest/15 dark:bg-lime/10 dark:text-lime dark:ring-lime/25">
          <UserRound className="size-3.5" aria-hidden />
          {a.eyebrow}
        </span>
        <h1 className="mt-2.5 text-3xl font-bold tracking-tight sm:text-4xl">{a.title}</h1>
        <span
          aria-hidden
          className="mt-3 block h-1 w-12 rounded-full bg-gradient-to-r from-brand to-lime rtl:bg-gradient-to-l"
        />
        <p className="mt-4 break-words text-zinc-600 dark:text-zinc-400">
          {fmt(a.memberSince, { email: user.email ?? "", date: memberSince })}
        </p>
      </div>

      {welcome && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-mint px-4 py-3.5 text-sm text-forest ring-1 ring-brand/15 dark:bg-lime/10 dark:text-lime dark:ring-lime/25">
          <PartyPopper className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p>{a.welcome}</p>
        </div>
      )}

      <section className="relative mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-forest via-forest to-brand p-4 text-white shadow-lg shadow-forest/20 sm:p-6">
        <span
          aria-hidden
          className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-lime/50 to-transparent"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -end-16 -top-16 size-56 rounded-full bg-lime/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="shrink-0 self-start rounded-full p-1 ring-2 ring-lime/60 sm:self-center">
            <Avatar name={profile.full_name} src={avatarUrl} size="xl" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                {profile.full_name || a.title}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-lime/15 px-2.5 py-0.5 text-xs font-semibold text-lime ring-1 ring-lime/40">
                <Sparkles className="size-3" aria-hidden />
                {t.plans.labels[profile.plan]}
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/85 ring-1 ring-white/20">
                {t.nav.roles[profile.role]}
              </span>
            </div>
            {/* Outline badges are muted grey, unreadable on the green card. */}
            <div className="mt-2 [&_[data-variant=outline]]:border-white/30 [&_[data-variant=outline]]:bg-white/10 [&_[data-variant=outline]]:text-white/90">
              <VerificationBadges profile={profile} dealer={dealer} />
            </div>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-3 gap-2 sm:gap-3">
          <StatTile icon={Crown} label={a.statPlan} highlight>
            {t.plans.labels[profile.plan]}
          </StatTile>
          <StatTile icon={CalendarDays} label={a.statMemberSince}>
            {memberSince}
          </StatTile>
          <StatTile icon={MapPin} label={a.statCity}>
            {profile.city ? cityName(t, profile.city) : "—"}
          </StatTile>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 sm:p-7 dark:bg-zinc-900 dark:ring-zinc-800">
          <h2 className="text-lg font-semibold tracking-tight">{a.detailsTitle}</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{a.detailsIntro}</p>
          <div className="mt-6 border-t border-zinc-100 pt-6 dark:border-zinc-800">
            <AvatarUploader name={profile.full_name} avatarUrl={avatarUrl} />
          </div>
          <div className="mt-6 border-t border-zinc-100 pt-6 dark:border-zinc-800">
            <ProfileForm profile={profile} action={updateProfile} submitLabel={a.save} />
          </div>
        </section>

        <aside>
          <h2 className="text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            {a.nextStepsTitle}
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {steps.length > 0 ? (
              steps.map((step) => <ActionCard key={step.href} {...step} />)
            ) : (
              <div className="flex items-start gap-3 rounded-2xl bg-mint p-4 ring-1 ring-brand/15 dark:bg-lime/10 dark:ring-lime/25">
                <BadgeCheck className="mt-0.5 size-5 shrink-0 text-brand dark:text-lime" aria-hidden />
                <div>
                  <p className="font-semibold text-forest dark:text-lime">{a.allSetTitle}</p>
                  <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{a.allSetText}</p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function StatTile({
  icon: Icon,
  label,
  highlight = false,
  children,
}: {
  icon: LucideIcon;
  label: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`min-w-0 rounded-xl p-2.5 ring-1 backdrop-blur-sm sm:p-3 ${
        highlight ? "bg-lime/15 ring-lime/40" : "bg-white/[0.07] ring-white/15"
      }`}
    >
      <p className="flex items-center gap-1.5 text-xs text-white/70">
        <Icon className={`size-3.5 shrink-0 ${highlight ? "text-lime" : ""}`} aria-hidden />
        <span className="truncate">{label}</span>
      </p>
      <p className="mt-1.5 line-clamp-2 text-sm leading-snug font-semibold tracking-tight break-words sm:text-lg">
        {children}
      </p>
    </div>
  );
}

function ActionCard({ href, icon: Icon, title, description }: Step) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 transition-all hover:shadow-md hover:ring-brand/40 motion-safe:hover:-translate-y-px dark:bg-zinc-900 dark:ring-zinc-800 dark:hover:ring-lime/40"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint text-brand dark:bg-lime/10 dark:text-lime">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-zinc-900 dark:text-zinc-100">{title}</span>
        <span className="mt-0.5 block text-sm text-zinc-600 dark:text-zinc-400">{description}</span>
      </span>
      <ChevronRight
        className="size-4 shrink-0 text-zinc-400 transition-transform group-hover:text-brand motion-safe:group-hover:translate-x-0.5 rtl:rotate-180 motion-safe:rtl:group-hover:-translate-x-0.5 dark:group-hover:text-lime"
        aria-hidden
      />
    </Link>
  );
}
