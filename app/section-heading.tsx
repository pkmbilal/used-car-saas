import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

// Small uppercase label with a green hairline in front.
export function Eyebrow({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" }) {
  return (
    <p
      className={`flex items-center gap-3 text-eyebrow font-semibold tracking-[0.3em] ${
        tone === "dark" ? "text-lime" : "text-brand-600"
      }`}
    >
      <span aria-hidden className="h-px w-8 bg-current opacity-70" />
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
  link?: { href: string; label: string };
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
      </div>
      {link && (
        <Link
          href={link.href}
          className="group mb-1.5 flex shrink-0 items-center gap-2 text-caption font-semibold text-brand underline-offset-4 hover:text-brand hover:underline"
        >
          {link.label}
          <ArrowRight className="size-3 transition group-hover:translate-x-0.5" strokeWidth={2.4} />
        </Link>
      )}
    </div>
  );
}
