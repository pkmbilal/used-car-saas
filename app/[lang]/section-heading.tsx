"use client";

import { useDictionary } from "@/components/i18n-provider";
import Link from "@/components/locale-link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

// Small uppercase label with a green hairline in front.
export function Eyebrow({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" }) {
  return (
    <p
      className={`flex items-center gap-2 text-eyebrow font-semibold tracking-[0.2em] max-sm:text-[0.6875rem] sm:gap-3 sm:tracking-[0.3em] ${
        tone === "dark" ? "text-lime" : "text-brand-600"
      }`}
    >
      <span aria-hidden className="h-px w-5 bg-current opacity-70 sm:w-8" />
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  link,
}: {
  eyebrow: string;
  title: string;
  // shortLabel replaces label on phones, where the full one squeezes the title.
  link?: { href: string; label: string; shortLabel?: string };
}) {
  const { t } = useDictionary();
  return (
    <div className="flex items-start justify-between gap-4 sm:items-end">
      <div className="min-w-0">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-2 font-display text-[1.625rem] leading-tight font-semibold tracking-tight text-balance sm:mt-3 sm:text-3xl md:text-4xl">
          {title}
        </h2>
      </div>
      {link && (
        <Link
          href={link.href}
          aria-label={link.label}
          className="group flex shrink-0 items-center gap-2 text-caption font-semibold text-brand underline-offset-4 hover:text-brand hover:underline max-sm:mt-[1.85rem] sm:mb-1.5"
        >
          <span className="sm:hidden">{link.shortLabel ?? t.home.seeAll}</span>
          <span className="max-sm:hidden">{link.label}</span>
          <ArrowRight className="size-3 transition group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" strokeWidth={2.4} />
        </Link>
      )}
    </div>
  );
}
