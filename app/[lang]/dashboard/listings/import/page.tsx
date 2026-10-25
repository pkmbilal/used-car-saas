import type { Metadata } from "next";
import Link from "@/components/locale-link";
import { rich } from "@/components/rich-text";
import { requireSeller } from "@/lib/auth";
import { CITIES } from "@/lib/cities";
import { fmt } from "@/lib/dictionary";
import type { Dictionary } from "@/lib/dictionaries";
import { getDictionary } from "@/lib/i18n-server";
import { BODY_TYPES, CONDITIONS, FEATURE_VALUES, FUEL_TYPES, TRANSMISSIONS } from "@/lib/listing-options";
import { IMPORT_COLUMNS, MAX_IMPORT_ROWS } from "@/lib/listing-import";
import { MAKES } from "@/lib/makes";
import {
  draftImportTooManyMessage,
  getDraftUsage,
  getListingQuota,
  isDealerPlan,
  quotaReachedNote,
  quotaSummary,
} from "@/lib/plans";
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
  return { title: t.dashboard.import.metaTitle };
}

export default async function ImportListingsPage() {
  const { user, profile } = await requireSeller("/dashboard/listings/import");
  const [quota, drafts] = await Promise.all([
    getListingQuota(),
    getDraftUsage(user.id, profile.plan),
  ]);
  const { t, locale } = await getDictionary();
  const p = t.dashboard.import;
  const hints = columnHints(t);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link href="/dashboard" className="text-sm text-zinc-600 dark:text-zinc-400">
        {t.dashboard.backToListings}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{p.title}</h1>

      {!isDealerPlan(profile.plan) ? (
        <p className="mt-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {p.dealerOnly}{" "}
          <Link href="/pricing" className="font-medium underline">
            {p.seeDealerPlans}
          </Link>
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {fmt(p.intro, { max: MAX_IMPORT_ROWS })}
          </p>
          {quota && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{quotaSummary(t, locale, quota)}</p>
          )}
          {drafts.remaining < MAX_IMPORT_ROWS && (
            <p className="mt-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              {draftImportTooManyMessage(t, drafts)}
            </p>
          )}
          {quota?.remaining === 0 && (
            <p className="mt-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              {quotaReachedNote(t, quota)}{" "}
              <Link href="/pricing" className="font-medium underline">
                {p.seePlans}
              </Link>
            </p>
          )}

          <div className="mt-8">
            <ImportForm />
          </div>

          <h2 className="mt-12 text-lg font-semibold">{p.fileFormat}</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {rich(p.formatIntro, {
              link: (
                <a href="/listing-import-template.csv" download className="font-medium underline">
                  {p.downloadTemplate}
                </a>
              ),
            })}
          </p>
          <table className="mt-4 w-full text-start text-sm">
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {IMPORT_COLUMNS.map((column) => (
                <tr key={column}>
                  <td className="py-2 pe-4 font-mono">{column}</td>
                  <td className="py-2 text-zinc-600 dark:text-zinc-400">{hints[column]}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <details className="mt-6 text-sm">
            <summary className="cursor-pointer font-medium">{p.supportedMakes}</summary>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">{MAKES.join(", ")}</p>
          </details>
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-medium">{p.supportedCities}</summary>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">{CITIES.join(", ")}</p>
          </details>
        </>
      )}
    </main>
  );
}
