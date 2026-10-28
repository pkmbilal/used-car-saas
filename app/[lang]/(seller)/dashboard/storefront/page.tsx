import type { Metadata } from "next";
import { ArrowUpRight, Check, Lock, MapPin, Store } from "lucide-react";
import Link from "@/components/locale-link";
import { requireSeller, type Profile } from "@/lib/auth";
import { fmt } from "@/lib/dictionary";
import type { Dictionary } from "@/lib/dictionaries";
import { getDictionary } from "@/lib/i18n-server";
import { isDealerPlan } from "@/lib/plans";
import { publicUrl } from "@/lib/r2";
import { PageHeader } from "../page-header";
import { LogoUploader } from "./logo-uploader";
import { StorefrontForm } from "./storefront-form";
import { noIndex } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.account.storefront.metaTitle, robots: noIndex };
}

export default async function StorefrontPage() {
  const { user, profile } = await requireSeller("/dashboard/storefront");
  const { t } = await getDictionary();
  const s = t.account.storefront;

  if (!isDealerPlan(profile.plan)) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <PageHeader eyebrow={s.locked.badge} eyebrowIcon={Lock} title={s.title} />
        <LockedStorefront t={t} plan={profile.plan} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <PageHeader
        eyebrow={s.eyebrow}
        title={s.title}
        intro={
          <>
            {s.intro}{" "}
            <Link href={`/sellers/${user.id}`} className="font-medium underline">
              {s.view}
            </Link>
          </>
        }
      />
      <div className="mt-8 flex flex-col gap-8">
        <LogoUploader logoUrl={profile.logo_key ? publicUrl(profile.logo_key) : null} />
        <StorefrontForm profile={profile} />
      </div>
    </div>
  );
}

// Free and Pro sellers: what a storefront gives, a sample of the page and a link to the plans.
function LockedStorefront({ t, plan }: { t: Dictionary; plan: Profile["plan"] }) {
  const l = t.account.storefront.locked;
  return (
    <section className="relative mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-forest via-forest to-brand p-5 text-white shadow-lg shadow-forest/20 sm:p-7">
      <span
        aria-hidden
        className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-lime/50 to-transparent"
      />
      <div className="grid gap-6 md:grid-cols-[1fr_minmax(0,18rem)] md:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lime/15 px-2.5 py-1 text-xs font-semibold text-lime ring-1 ring-lime/30">
            <Lock className="size-3.5" aria-hidden />
            {l.badge}
          </span>
          <h2 className="mt-3 text-xl font-bold sm:text-2xl">{l.title}</h2>
          <p className="mt-1.5 max-w-xl text-sm text-white/80">{l.body}</p>
          <ul className="mt-4 grid gap-2">
            {[l.points.branding, l.points.showroom, l.points.page].map((point) => (
              <li key={point} className="flex items-start gap-2 rounded-xl bg-white/[0.07] p-3 text-sm ring-1 ring-white/15">
                <Check className="mt-0.5 size-4 shrink-0 text-lime" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <StorefrontPreview t={t} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-white/15 pt-5">
        <Link
          href="/pricing"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-gradient-to-b from-lime-light to-lime px-5 text-sm font-semibold text-on-lime shadow-[inset_0_1px_0_rgba(255,255,255,.45)] hover:text-on-lime hover:brightness-105"
        >
          {t.account.storefront.seePlans}
          <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden />
        </Link>
        <p className="text-sm text-white/70">
          {fmt(l.currentPlan, { plan: fmt(t.plans.named, { plan: t.plans.labels[plan] }) })}
        </p>
      </div>
    </section>
  );
}

// A mock of the public dealer page; decorative only.
function StorefrontPreview({ t }: { t: Dictionary }) {
  const l = t.account.storefront.locked;
  return (
    <div aria-hidden className="relative select-none">
      <span className="absolute -top-2.5 end-3 z-10 rounded-full bg-lime px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-lime">
        {l.previewLabel}
      </span>
      <div className="overflow-hidden rounded-xl bg-white text-zinc-900 shadow-xl shadow-black/25 ring-1 ring-white/20 md:rotate-1 rtl:md:-rotate-1">
        <div className="h-14 bg-gradient-to-r from-mint to-lime/40 rtl:bg-gradient-to-l" />
        <div className="px-4 pb-4">
          <div className="-mt-7 grid size-14 place-items-center rounded-xl bg-white text-forest shadow-md ring-1 ring-black/5">
            <Store className="size-6" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <p className="truncate font-bold">{l.sampleName}</p>
            <span className="rounded-full bg-forest/10 px-2 py-0.5 text-[10px] font-semibold text-forest">
              {l.dealerChip}
            </span>
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
            <MapPin className="size-3" />
            {l.sampleCity}
          </p>
          <div className="mt-3 space-y-1.5">
            <div className="h-2 w-full rounded-full bg-zinc-200" />
            <div className="h-2 w-4/5 rounded-full bg-zinc-200" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="overflow-hidden rounded-lg ring-1 ring-black/5">
                <div className="aspect-[4/3] bg-gradient-to-br from-zinc-200 to-zinc-100" />
                <div className="space-y-1 p-1.5">
                  <div className="h-1.5 w-full rounded-full bg-zinc-200" />
                  <div className="h-1.5 w-1/2 rounded-full bg-brand/40" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
