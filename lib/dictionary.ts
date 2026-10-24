// Shape and helpers for the UI dictionaries in lib/dictionaries. Dictionaries
// are plain data (no functions) so a Server Component can hand them to client
// components. Safe to import from client components.
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";

// Counted text, chosen with Intl.PluralRules. English needs `one` and
// `other`; Arabic also uses zero, two, few and many. "{count}" is replaced by
// the formatted number.
export type Plural = {
  readonly kind: "plural";
  readonly other: string;
} & Partial<Record<"zero" | "one" | "two" | "few" | "many", string>>;

export function plural(forms: Omit<Plural, "kind">): Plural {
  return { kind: "plural", ...forms };
}

// The English dictionary fixes the shape; every other locale must match it
// with its own strings.
type Widen<T> = T extends string ? string : T extends Plural ? Plural : { readonly [K in keyof T]: Widen<T[K]> };
export type DictionaryShape<T> = Widen<T>;

// "Hello {name}" + { name: "Sara" } -> "Hello Sara". Unknown keys stay as is.
export function fmt(template: string, values: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

const numberFormatters = new Map<Locale, Intl.NumberFormat>();
const pluralRules = new Map<Locale, Intl.PluralRules>();

// Western digits in both languages, as on most Saudi car sites.
export function formatNumber(locale: Locale, value: number): string {
  let formatter = numberFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US");
    numberFormatters.set(locale, formatter);
  }
  return formatter.format(value);
}

// "{count} cars" in the right plural form for the locale.
export function count(locale: Locale, value: number, forms: Plural, values: Record<string, string | number> = {}): string {
  let rules = pluralRules.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(locale);
    pluralRules.set(locale, rules);
  }
  const category = rules.select(value) as Exclude<keyof Plural, "kind">;
  const template = forms[category] ?? forms.other;
  return fmt(template, { ...values, count: formatNumber(locale, value) });
}

// Display name for a stored city spelling; unknown values show as stored.
export function cityName(t: Dictionary, city: string): string {
  return (t.cities as Record<string, string>)[city] ?? city;
}

// Label for a stored option value (fuel type, body type, …) from one of the
// dictionary's option maps; unknown values show as stored.
export function optionLabel(labels: Record<string, string>, value: string): string {
  return labels[value] ?? value;
}

// A server message in the page's language, from the dictionary's messages
// catalog (see en.ts). Unmapped messages are returned as is.
export function translateMessage(t: Dictionary, message: string): string {
  const catalog = t.messages as Record<string, string>;
  const exact = catalog[message];
  if (exact !== undefined) return exact;
  for (const [pattern, translation] of Object.entries(catalog)) {
    if (!pattern.includes("{")) continue;
    const names: string[] = [];
    const source = pattern
      .split(/(\{\w+\})/)
      .map((part) => {
        const name = /^\{(\w+)\}$/.exec(part)?.[1];
        if (!name) return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        names.push(name);
        return "(.+?)";
      })
      .join("");
    const match = new RegExp(`^${source}$`, "s").exec(message);
    if (match) return fmt(translation, Object.fromEntries(names.map((name, i) => [name, match[i + 1]])));
  }
  return message;
}
