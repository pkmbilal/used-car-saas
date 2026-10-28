import { ArrowUpRight, Check, ChevronDown, FileDown, FileText, Layers, Lock, Send, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "@/components/locale-link";
import { rich } from "@/components/rich-text";
import { requireSeller } from "@/lib/auth";
import { CITIES } from "@/lib/cities";
import { fmt, formatNumber } from "@/lib/dictionary";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-server";
import { BODY_TYPES, CONDITIONS, FEATURE_VALUES, FUEL_TYPES, TRANSMISSIONS } from "@/lib/listing-options";
import { IMPORT_COLUMNS, MAX_IMPORT_BYTES, MAX_IMPORT_ROWS, OPTIONAL_IMPORT_COLUMNS } from "@/lib/listing-import";
import { MAKES } from "@/lib/makes";
import {
  draftImportTooManyMessage,
  getDraftUsage,
  getListingQuota,
  isDealerPlan,
  quotaReachedNote,
  quotaSummary,
} from "@/lib/plans";
import { noIndex } from "@/lib/seo";
import { Notice } from "../../notice";
import { PageHeader } from "../../page-header";
import { ImportForm } from "./import-form";

// CSV values stay in English (they're the stored values), so the hints list
// them as is.
function columnHints(t: Dictionary): Record<(typeof IMPORT_COLUMNS)[number], string> {
  const h = t.dashboard.import.hints;
  return {
    make: h.make,
    model: h.model,
    year: h.year,
    mileage: h.mileage,
    price: h.price,
    condition: CONDITIONS.join(", "),
    city: h.city,
    fuel_type: FUEL_TYPES.join(", "),
    transmission: TRANSMISSIONS.join(", "),
    body_type: BODY_TYPES.join(", "),
    features: fmt(h.features, { values: FEATURE_VALUES.join(", ") }),
    color: h.color,
    description: h.description,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.dashboard.import.metaTitle, robots: noIndex };
}

const TEMPLATE_HREF = "/listing-import-template.csv";
const cardClass =
  "rounded-2xl bg-card shadow-[0_2px_10px_rgba(20,30,25,.06)] ring-1 ring-black/5 dark:ring-white/10";

export default async function ImportListingsPage() {
  const { user, profile } = await requireSeller("/dashboard/listings/import");
  const [quota, drafts] = await Promise.all([
    getListingQuota(),
    getDraftUsage(user.id, profile.plan),
  ]);
  const { t, locale } = await getDictionary();
  const p = t.dashboard.import;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        eyebrow={p.eyebrow}
        title={p.title}
        intro={isDealerPlan(profile.plan) ? fmt(p.intro, { max: MAX_IMPORT_ROWS }) : undefined}
      />

      {!isDealerPlan(profile.plan) ? (
        <LockedImport t={t} />
      ) : (
        <>
          <section className="relative mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-forest via-forest to-brand p-3 text-white shadow-lg shadow-forest/20 sm:p-5">
            <span
              aria-hidden
              className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-lime/50 to-transparent"
            />
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <StatTile icon={Layers} label={p.stats.rows} value={formatNumber(locale, MAX_IMPORT_ROWS)} />
              <StatTile
                icon={FileText}
                label={p.stats.drafts}
                value={formatNumber(locale, drafts.remaining)}
                warn={drafts.remaining < MAX_IMPORT_ROWS}
              />
              {quota && (
                <StatTile
                  icon={Send}
                  label={p.stats.listings}
                  value={quota.remaining === null ? p.stats.unlimited : formatNumber(locale, quota.remaining)}
                  warn={quota.remaining === 0}
                />
              )}
            </div>
            {quota && <p className="mt-3 px-1 text-xs text-white/70">{quotaSummary(t, locale, quota)}</p>}
          </section>

          {(drafts.remaining < MAX_IMPORT_ROWS || quota?.remaining === 0) && (
            <div className="mt-5 flex flex-col gap-3">
              {drafts.remaining < MAX_IMPORT_ROWS && (
                <Notice tone="warning">{draftImportTooManyMessage(t, drafts)}</Notice>
              )}
              {quota?.remaining === 0 && (
                <Notice tone="warning">
                  {quotaReachedNote(t, quota)}{" "}
                  <Link href="/dashboard#extra-listings" className="font-semibold underline">
                    {t.addons.buyExtra}
                  </Link>
                  {" · "}
                  <Link href="/pricing" className="font-semibold underline">
                    {p.seePlans}
                  </Link>
                </Notice>
              )}
            </div>
          )}

          <Steps t={t} locale={locale} />

          <section className={`mt-6 p-4 sm:p-6 ${cardClass}`}>
            <ImportForm templateHref={TEMPLATE_HREF} maxBytes={MAX_IMPORT_BYTES} />
          </section>

          <FileFormat t={t} />
        </>
      )}
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  warn = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-2.5 ring-1 backdrop-blur-sm sm:p-3 ${
        warn ? "bg-amber-300/15 ring-amber-300/40" : "bg-white/[0.07] ring-white/15"
      }`}
    >
      <p className="flex items-center gap-1.5 text-xs text-white/70">
        <Icon className={`size-3.5 shrink-0 ${warn ? "text-amber-300" : ""}`} aria-hidden />
        <span className="truncate">{label}</span>
      </p>
      <p className="mt-1.5 truncate text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</p>
    </div>
  );
}

function Steps({ t, locale }: { t: Dictionary; locale: Locale }) {
  const s = t.dashboard.import.steps;
  const steps = [s.template, s.fill, s.upload];
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{s.title}</h2>
      <ol className="mt-3 grid gap-3 sm:grid-cols-3">
        {steps.map((step, i) => (
          <li key={step.title} className={`relative flex gap-3 p-4 ${cardClass}`}>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-b from-brand to-forest text-sm font-bold text-white shadow-sm shadow-forest/25">
              {formatNumber(locale, i + 1)}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{step.title}</p>
              <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{step.body}</p>
              {i === 0 && (
                <a
                  href={TEMPLATE_HREF}
                  download
                  className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline dark:text-lime"
                >
                  <FileDown className="size-4" aria-hidden />
                  {t.dashboard.import.downloadTemplate}
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function FileFormat({ t }: { t: Dictionary }) {
  const p = t.dashboard.import;
  const hints = columnHints(t);
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">{p.fileFormat}</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {rich(p.formatIntro, {
          link: (
            <a href={TEMPLATE_HREF} download className="font-semibold text-brand underline dark:text-lime">
              {p.downloadTemplate}
            </a>
          ),
        })}
      </p>

      <div className={`mt-4 overflow-hidden ${cardClass}`}>
        <table className="w-full text-start text-sm">
          <thead className="bg-canvas text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th scope="col" className="px-4 py-2.5 text-start font-medium sm:ps-5">
                {p.column}
              </th>
              <th scope="col" className="px-4 py-2.5 text-start font-medium sm:pe-5">
                {p.whatToEnter}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {IMPORT_COLUMNS.map((column) => {
              const optional = OPTIONAL_IMPORT_COLUMNS.includes(column);
              return (
                <tr key={column} className="align-top">
                  <td className="px-4 py-3 sm:ps-5">
                    <code dir="ltr" className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-ink dark:bg-zinc-800 dark:text-zinc-100">
                      {column}
                    </code>
                    <span
                      className={`mt-1.5 block w-fit rounded-full px-2 py-px text-[0.6875rem] font-semibold ${
                        optional
                          ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                          : "bg-mint text-brand dark:bg-lime/15 dark:text-lime"
                      }`}
                    >
                      {optional ? p.optional : p.required}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 sm:pe-5 dark:text-zinc-400">{hints[column]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ValueList title={p.supportedMakes} values={MAKES} />
        <ValueList title={p.supportedCities} values={CITIES} />
      </div>
    </section>
  );
}

function ValueList({ title, values }: { title: string; values: readonly string[] }) {
  return (
    <details className={`group self-start ${cardClass}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        <span>
          {title}{" "}
          <span className="ms-1 rounded-full bg-zinc-100 px-1.5 py-px text-xs font-medium text-zinc-600 tabular-nums dark:bg-zinc-800 dark:text-zinc-300">
            {values.length}
          </span>
        </span>
        <ChevronDown className="size-4 text-zinc-500 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <ul dir="ltr" className="flex flex-wrap gap-1.5 border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
        {values.map((value) => (
          <li
            key={value}
            className="rounded-full bg-canvas px-2 py-0.5 text-xs text-zinc-700 ring-1 ring-line dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700"
          >
            {value}
          </li>
        ))}
      </ul>
    </details>
  );
}

// Free and Pro sellers: what CSV import gives, with a link to the plans.
function LockedImport({ t }: { t: Dictionary }) {
  const l = t.dashboard.import.locked;
  return (
    <section className="relative mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-forest via-forest to-brand p-5 text-white shadow-lg shadow-forest/20 sm:p-7">
      <span
        aria-hidden
        className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-lime/50 to-transparent"
      />
      <span className="inline-flex items-center gap-1.5 rounded-full bg-lime/15 px-2.5 py-1 text-xs font-semibold text-lime ring-1 ring-lime/30">
        <Lock className="size-3.5" aria-hidden />
        {l.badge}
      </span>
      <h2 className="mt-3 text-xl font-bold sm:text-2xl">{l.title}</h2>
      <p className="mt-1.5 max-w-xl text-sm text-white/80">{fmt(l.body, { max: MAX_IMPORT_ROWS })}</p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-3">
        {[l.points.bulk, l.points.drafts, l.points.storefront].map((point) => (
          <li key={point} className="flex items-start gap-2 rounded-xl bg-white/[0.07] p-3 text-sm ring-1 ring-white/15">
            <Check className="mt-0.5 size-4 shrink-0 text-lime" aria-hidden />
            {point}
          </li>
        ))}
      </ul>
      <Link
        href="/pricing"
        className="mt-5 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-gradient-to-b from-lime-light to-lime px-5 text-sm font-semibold text-on-lime shadow-[inset_0_1px_0_rgba(255,255,255,.45)] hover:text-on-lime hover:brightness-105"
      >
        {t.dashboard.import.seeDealerPlans}
        <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden />
      </Link>
    </section>
  );
}
