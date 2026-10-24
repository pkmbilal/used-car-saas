import { count, formatNumber, type Plural } from "@/lib/dictionary";
import type { Locale } from "@/lib/i18n";

// Arabic pages use Arabic month names on the Gregorian calendar with Western
// digits (ar-SA alone would switch to the Hijri calendar).
const INTL_LOCALE: Record<Locale, string> = { ar: "ar-SA-u-ca-gregory-nu-latn", en: "en-GB" };

const amountFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

// "165,000". On the page, prices render through <RiyalPrice>, which adds the
// riyal symbol. Digits are the same in both languages.
export function formatAmount(amount: number): string {
  return amountFormatter.format(amount);
}

// Plain-text prices (page titles, WhatsApp messages, select labels) where the
// riyal symbol image can't go.
export function formatSAR(amount: number, locale: Locale): string {
  return locale === "ar" ? `${formatAmount(amount)} ر.س` : `SAR ${formatAmount(amount)}`;
}

export function formatKm(km: number, locale: Locale): string {
  return `${formatNumber(locale, km)} ${locale === "ar" ? "كم" : "km"}`;
}

// Phones are stored as +9665XXXXXXXX; wa.me wants digits only.
export function whatsappUrl(phone: string, text: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function dateFormatter(locale: Locale, kind: "monthYear" | "day"): Intl.DateTimeFormat {
  const key = `${locale}:${kind}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(
      INTL_LOCALE[locale],
      kind === "monthYear"
        ? { month: "long", year: "numeric" }
        : { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Riyadh" },
    );
    formatters.set(key, formatter);
  }
  return formatter;
}

export function formatMonthYear(date: string, locale: Locale): string {
  return dateFormatter(locale, "monthYear").format(new Date(date));
}

export function formatDay(date: string, locale: Locale): string {
  return dateFormatter(locale, "day").format(new Date(date));
}

// "120 views · 4 calls · 9 WhatsApps", for the seller's own listings.
export function formatListingStats(
  locale: Locale,
  stats: { views: number; calls: number; whatsapps: number },
  forms: { views: Plural; calls: Plural; whatsapps: Plural },
): string {
  return [
    count(locale, stats.views, forms.views),
    count(locale, stats.calls, forms.calls),
    count(locale, stats.whatsapps, forms.whatsapps),
  ].join(" · ");
}

// "3 listings": English counts for the admin panel.
export function formatCount(value: number, noun: string): string {
  return `${new Intl.NumberFormat("en-US").format(value)} ${noun}${value === 1 ? "" : "s"}`;
}
