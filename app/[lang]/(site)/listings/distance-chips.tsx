import Link from "@/components/locale-link";
import { NEAR_RADII } from "@/lib/cities";
import { fmt } from "@/lib/dictionary";
import { formatKm } from "@/lib/format";
import { getDictionary } from "@/lib/i18n-server";
import type { ListingFilters } from "@/lib/listings";

type SearchParams = Record<string, string | string[] | undefined>;

// One-click radius for "near me" searches. Plain links: each keeps the other
// params and starts again from page 1.
export async function DistanceChips({ filters, params }: { filters: ListingFilters; params: SearchParams }) {
  if (!filters.near) return null;
  const { t, locale } = await getDictionary();

  function hrefFor(km: number) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string" && value !== "" && key !== "page" && key !== "radius") query.set(key, value);
    }
    query.set("radius", String(km));
    return `/listings?${query}`;
  }

  return (
    <nav aria-label={t.nearMe.radius} className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-caption font-semibold text-ink/70">{t.nearMe.radiusLabel}</span>
      {NEAR_RADII.map((km) => {
        const active = km === filters.radiusKm;
        return (
          <Link
            key={km}
            href={hrefFor(km)}
            aria-current={active ? "true" : undefined}
            className={`inline-flex h-7 items-center rounded-full border px-3 text-caption font-medium ${
              active
                ? "border-brand bg-brand text-white hover:text-white"
                : "border-line bg-white text-ink hover:border-brand hover:bg-mint"
            }`}
          >
            {fmt(t.nearMe.within, { distance: formatKm(km, locale) })}
          </Link>
        );
      })}
    </nav>
  );
}
