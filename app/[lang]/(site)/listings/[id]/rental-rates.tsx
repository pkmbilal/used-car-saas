import { CalendarClock, Gauge, ShieldCheck } from "lucide-react";
import { RiyalPrice } from "@/components/riyal-price";
import { count, fmt } from "@/lib/dictionary";
import { formatKm, formatSAR } from "@/lib/format";
import { getDictionary } from "@/lib/i18n-server";
import type { Listing } from "@/lib/listings";

type Props = {
  listing: Pick<Listing, "price" | "weekly_price" | "monthly_price" | "min_rental_days" | "deposit" | "daily_km_limit">;
};

// Daily / weekly / monthly rates and the rental terms, on a rental listing's page.
export async function RentalRates({ listing }: Props) {
  const { t, locale } = await getDictionary();
  const r = t.rentals;
  const rates = [
    { label: r.daily, amount: Number(listing.price), unit: r.perDay },
    listing.weekly_price !== null && { label: r.weekly, amount: Number(listing.weekly_price), unit: r.perWeek },
    listing.monthly_price !== null && { label: r.monthly, amount: Number(listing.monthly_price), unit: r.perMonth },
  ].filter((rate): rate is { label: string; amount: number; unit: string } => Boolean(rate));
  const deposit = listing.deposit === null ? null : Number(listing.deposit);
  const terms = [
    { Icon: CalendarClock, text: count(locale, listing.min_rental_days ?? 1, r.minDaysValue) },
    {
      Icon: ShieldCheck,
      text: deposit ? fmt(r.depositValue, { amount: formatSAR(deposit, locale) }) : r.noDeposit,
    },
    {
      Icon: Gauge,
      text:
        listing.daily_km_limit === null
          ? r.unlimitedKm
          : fmt(r.kmLimitValue, { km: formatKm(listing.daily_km_limit, locale) }),
    },
  ];

  return (
    <section>
      <h2 className="text-lg font-semibold">{r.rates}</h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        {rates.map((rate) => (
          <div key={rate.label} className="rounded-lg bg-white px-4 py-3 shadow-[0_2px_10px_rgba(20,30,25,.05)]">
            <dt className="text-caption text-muted-foreground">{rate.label}</dt>
            <dd className="mt-1 text-lg font-bold text-brand">
              <RiyalPrice amount={rate.amount} />
              <span className="ms-1 text-caption font-medium text-muted-foreground">{rate.unit}</span>
            </dd>
          </div>
        ))}
      </dl>
      <h3 className="mt-5 text-sm font-semibold">{r.terms}</h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {terms.map(({ Icon, text }) => (
          <li key={text} className="inline-flex items-center gap-1.5 rounded-full bg-mint px-3 py-1.5 text-caption font-medium text-ink">
            <Icon className="size-3.5 text-brand" aria-hidden />
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
}
