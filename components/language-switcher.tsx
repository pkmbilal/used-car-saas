"use client";

import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import { useDictionary } from "@/components/i18n-provider";
import { switchLocalePath, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const LOCALES: { locale: Locale; label: string; name: string }[] = [
  { locale: "ar", label: "ع", name: "العربية" },
  { locale: "en", label: "EN", name: "English" },
];

const segment = "inline-flex h-7 min-w-9 items-center justify-center rounded-full px-2.5 text-[13px] font-semibold";

// A segmented pill showing both languages, the current one highlighted. The
// other links to the same page in that language: a full page load, since the
// document's lang, direction and fonts all change; proxy.ts remembers the
// choice in a cookie. "row" lays it out as a labelled row for the mobile menu.
export function LanguageSwitcher({ variant = "pill", className }: { variant?: "pill" | "row"; className?: string }) {
  const pathname = usePathname();
  const { t, locale: current } = useDictionary();

  const pill = (
    <div
      role="group"
      aria-label={t.nav.language}
      className="inline-flex items-center gap-0.5 rounded-full bg-white/[0.04] p-1 ring-1 ring-white/10"
    >
      {variant === "pill" && <Globe className="mx-1 size-3.5 text-white/45" aria-hidden />}
      {LOCALES.map(({ locale, label, name }) => {
        if (locale === current) {
          return (
            <span
              key={locale}
              lang={locale}
              aria-current="true"
              title={name}
              className={cn(segment, "relative bg-white/10 text-white ring-1 ring-white/15 shadow-[0_1px_8px_-2px_rgb(0_0_0/0.5)]")}
            >
              {label}
              <span aria-hidden className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-lime" />
            </span>
          );
        }
        const href = switchLocalePath(pathname, locale);
        return (
          <a
            key={locale}
            href={href}
            hrefLang={locale}
            lang={locale}
            title={name}
            aria-label={name}
            onClick={(event) => {
              event.preventDefault();
              window.location.assign(href + window.location.search);
            }}
            className={cn(
              segment,
              "text-white/55 outline-none transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:ring-2 focus-visible:ring-lime/60",
            )}
          >
            {label}
          </a>
        );
      })}
    </div>
  );

  if (variant === "pill") return <div className={className}>{pill}</div>;

  return (
    <div className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-white", className)}>
      <Globe className="size-4 text-white/60" aria-hidden />
      {t.nav.language}
      <div className="ms-auto">{pill}</div>
    </div>
  );
}
