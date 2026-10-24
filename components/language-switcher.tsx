"use client";

import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";
import { useLocale } from "@/components/locale-link";
import { switchLocalePath, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const OTHER: Record<Locale, { locale: Locale; label: string }> = {
  ar: { locale: "en", label: "English" },
  en: { locale: "ar", label: "العربية" },
};

// Links to the same page in the other language. A full page load, since the
// document's lang, direction and fonts all change; proxy.ts remembers the
// choice in a cookie.
export function LanguageSwitcher({ className }: { className?: string }) {
  const pathname = usePathname();
  const { locale, label } = OTHER[useLocale()];
  const href = switchLocalePath(pathname, locale);

  return (
    <a
      href={href}
      hrefLang={locale}
      lang={locale}
      onClick={(event) => {
        event.preventDefault();
        window.location.assign(href + window.location.search);
      }}
      className={cn("inline-flex items-center gap-1.5", className)}
    >
      <Languages className="size-4" aria-hidden />
      {label}
    </a>
  );
}
