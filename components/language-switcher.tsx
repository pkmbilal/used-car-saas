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

// Links to the same page in another language: a full page load, since the
// document's lang, direction and fonts all change; proxy.ts remembers the
// choice in a cookie.
function LocaleLink({
  locale,
  label,
  name,
  className,
  children,
}: (typeof LOCALES)[number] & { className: string; children?: React.ReactNode }) {
  const pathname = usePathname();
  const href = switchLocalePath(pathname, locale);
  return (
    <a
      href={href}
      hrefLang={locale}
      lang={locale}
      title={name}
      aria-label={name}
      onClick={(event) => {
        event.preventDefault();
        window.location.assign(href + window.location.search);
      }}
      className={className}
    >
      {children}
      {label}
    </a>
  );
}

// "toggle" (the desktop header) is one compact button for the other language.
// "row" is a labelled row for the mobile menu, with a segmented pill showing
// both languages and the current one highlighted.
export function LanguageSwitcher({ variant = "toggle", className }: { variant?: "toggle" | "row"; className?: string }) {
  const { t, locale: current } = useDictionary();

  if (variant === "toggle") {
    const other = LOCALES.find(({ locale }) => locale !== current) ?? LOCALES[0];
    return (
      <LocaleLink
        {...other}
        className={cn(
          "inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 text-[13px] font-semibold text-white/75 ring-1 ring-white/10 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-lime/60",
          className,
        )}
      >
        <Globe className="size-3.5 text-white/45" aria-hidden />
      </LocaleLink>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-white", className)}>
      <Globe className="size-4 text-white/60" aria-hidden />
      {t.nav.language}
      <div
        role="group"
        aria-label={t.nav.language}
        className="ms-auto inline-flex items-center gap-0.5 rounded-full bg-white/[0.04] p-1 ring-1 ring-white/10"
      >
        {LOCALES.map((option) =>
          option.locale === current ? (
            <span
              key={option.locale}
              lang={option.locale}
              aria-current="true"
              title={option.name}
              className={cn(segment, "relative bg-white/10 text-white ring-1 ring-white/15 shadow-[0_1px_8px_-2px_rgb(0_0_0/0.5)]")}
            >
              {option.label}
              <span aria-hidden className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-lime" />
            </span>
          ) : (
            <LocaleLink
              key={option.locale}
              {...option}
              className={cn(
                segment,
                "text-white/55 outline-none transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:ring-2 focus-visible:ring-lime/60",
              )}
            />
          ),
        )}
      </div>
    </div>
  );
}
