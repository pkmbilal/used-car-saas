import type { DictionaryShape } from "@/lib/dictionary";
import type { City } from "@/lib/cities";
import type { Locale } from "@/lib/i18n";
import { ar } from "./ar";
import { en } from "./en";

export type Dictionary = DictionaryShape<typeof en>;

export const dictionaries: Record<Locale, Dictionary> = { ar, en };

// Every stored city needs a display name.
en.cities satisfies Record<City, string>;
