import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import { CITIES } from "@/lib/cities";
import { BODY_TYPES, CONDITIONS, FEATURE_VALUES, FUEL_TYPES, TRANSMISSIONS } from "@/lib/listing-options";
import { IMPORT_COLUMNS, MAX_IMPORT_ROWS } from "@/lib/listing-import";
import { MAKES } from "@/lib/makes";
import { getListingQuota, isDealerPlan, quotaExceededMessage, quotaSummary } from "@/lib/plans";
import { ImportForm } from "./import-form";

const COLUMN_HINTS: Record<(typeof IMPORT_COLUMNS)[number], string> = {
  make: "One of the makes below",
  model: "Free text, e.g. Camry",
  year: "e.g. 2021",
  mileage: "Kilometres, e.g. 45000",
  price: "SAR, e.g. 85000",
  condition: CONDITIONS.join(", "),
  city: "One of the cities below",
  fuel_type: FUEL_TYPES.join(", "),
  transmission: TRANSMISSIONS.join(", "),
  body_type: BODY_TYPES.join(", "),
  features: `Optional. Any of ${FEATURE_VALUES.join(", ")}, separated by ; e.g. sunroof;navigation`,
};

export default async function ImportListingsPage() {
  const { profile } = await requireSeller("/dashboard/listings/import");
  const quota = await getListingQuota();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link href="/dashboard" className="text-sm text-zinc-600 dark:text-zinc-400">
        ← Your listings
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Import listings from CSV</h1>

      {!isDealerPlan(profile.plan) ? (
        <p className="mt-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          CSV import is available on dealer plans. Contact us to upgrade.
        </p>
      ) : quota?.remaining === 0 ? (
        <p className="mt-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {quotaExceededMessage(quota)}
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Each row becomes a draft listing. Add photos and publish them from your dashboard.
            Up to {MAX_IMPORT_ROWS} rows per file. If any row has a problem, nothing is imported.
          </p>
          {quota && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{quotaSummary(quota)}</p>
          )}

          <div className="mt-8">
            <ImportForm />
          </div>

          <h2 className="mt-12 text-lg font-semibold">File format</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            The first row must name these columns, in any order.{" "}
            <a href="/listing-import-template.csv" download className="font-medium underline">
              Download the template
            </a>
            .
          </p>
          <table className="mt-4 w-full text-left text-sm">
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {IMPORT_COLUMNS.map((column) => (
                <tr key={column}>
                  <td className="py-2 pr-4 font-mono">{column}</td>
                  <td className="py-2 text-zinc-600 dark:text-zinc-400">{COLUMN_HINTS[column]}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <details className="mt-6 text-sm">
            <summary className="cursor-pointer font-medium">Supported makes</summary>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">{MAKES.join(", ")}</p>
          </details>
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-medium">Supported cities</summary>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">{CITIES.join(", ")}</p>
          </details>
        </>
      )}
    </main>
  );
}
