"use client";

import { createContext, useContext } from "react";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";

const I18nContext = createContext<{ t: Dictionary; locale: Locale } | null>(null);

// Hands the current locale's dictionary to client components. Set once in
// app/[lang]/layout.tsx.
export function I18nProvider({ t, locale, children }: { t: Dictionary; locale: Locale; children: React.ReactNode }) {
  return <I18nContext value={{ t, locale }}>{children}</I18nContext>;
}

// The UI strings and locale, for client components.
export function useDictionary() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useDictionary() needs an I18nProvider above it");
  return value;
}
