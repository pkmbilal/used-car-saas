import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowUp, CalendarDays, Mail, ReceiptText, Scale, ShieldCheck } from "lucide-react";
import Link from "@/components/locale-link";
import { COMPANY_ADDRESS, COMPANY_CR_NUMBER, COMPANY_NAME, SUPPORT_EMAIL } from "@/lib/contact";
import { fmt } from "@/lib/dictionary";
import { getDictionary } from "@/lib/i18n-server";

export const LEGAL_CONTACT_EMAIL = SUPPORT_EMAIL;

export type LegalDoc = "terms" | "privacy" | "refunds";
export type LegalSection = { title: ReactNode; body: ReactNode };

const DOCS: { doc: LegalDoc; href: string; icon: LucideIcon }[] = [
  { doc: "terms", href: "/terms", icon: Scale },
  { doc: "privacy", href: "/privacy", icon: ShieldCheck },
  { doc: "refunds", href: "/refunds", icon: ReceiptText },
];

// Body copy styling for section content (paragraphs, lists, inline links).
const prose =
  "flex flex-col gap-3 text-[15px] leading-7 text-zinc-700 [&_a]:text-brand [&_a]:decoration-brand/30 [&_a]:underline-offset-2 [&_a:hover]:decoration-brand [&_li]:ps-1 [&_li]:marker:text-brand [&_strong]:text-ink [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:ps-5";

function sectionId(index: number): string {
  return `section-${index + 1}`;
}

export async function LegalPage({
  doc,
  title,
  updated,
  intro,
  sections,
}: {
  doc: LegalDoc;
  title: string;
  updated: string;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  const { t, locale } = await getDictionary();
  const l = t.legal;
  const Icon = DOCS.find((item) => item.doc === doc)?.icon ?? Scale;
  const company = [
    COMPANY_NAME,
    COMPANY_CR_NUMBER && fmt(t.common.crNumber, { number: COMPANY_CR_NUMBER }),
    COMPANY_ADDRESS?.[locale],
  ].filter(Boolean);
  const number = (index: number) => String(index + 1).padStart(2, "0");

  return (
    <main id="top" className="light flex-1 bg-canvas text-ink">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-line bg-white">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-24 -end-24 size-72 rounded-full bg-lime/20 blur-3xl"
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-8 pb-6 sm:px-6 sm:pt-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-forest/5 px-2.5 py-1 text-xs font-semibold tracking-wide text-forest ring-1 ring-forest/15">
            <Icon className="size-3.5" aria-hidden />
            {l.eyebrow}
          </span>
          <h1 className="mt-2.5 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <span
            aria-hidden
            className="mt-3 block h-1 w-12 rounded-full bg-gradient-to-r from-brand to-lime rtl:bg-gradient-to-l"
          />
          <p className="mt-4 flex items-center gap-1.5 text-sm text-zinc-500">
            <CalendarDays className="size-4" aria-hidden />
            {fmt(t.common.lastUpdated, { date: updated })}
          </p>

          <nav aria-label={l.documents} className="mt-6">
            <div className="grid grid-cols-3 gap-1 rounded-2xl bg-zinc-100 p-1 ring-1 ring-zinc-200 sm:inline-grid sm:rounded-full">
              {DOCS.map(({ doc: item, href, icon: ItemIcon }) => {
                const active = item === doc;
                return (
                  <Link
                    key={item}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl px-2 text-center text-xs leading-tight font-semibold sm:rounded-full sm:px-3.5 sm:text-sm transition-colors ${
                      active
                        ? "bg-gradient-to-b from-brand to-forest text-white shadow-sm shadow-forest/25 hover:text-white"
                        : "text-zinc-600 hover:bg-white hover:text-ink"
                    }`}
                  >
                    <ItemIcon className="size-4 shrink-0 max-sm:hidden" aria-hidden />
                    {t.footer[item]}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
        {/* Contents */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <details className="group rounded-2xl bg-white ring-1 ring-line lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold">
              {l.onThisPage}
              <span className="text-zinc-400 transition-transform group-open:rotate-180" aria-hidden>
                ▾
              </span>
            </summary>
            <Contents sections={sections} number={number} className="border-t border-line px-2 py-2" />
          </details>
          <div className="max-lg:hidden">
            <p className="px-3 text-caption font-bold tracking-[0.15em] text-zinc-400 uppercase">{l.onThisPage}</p>
            <Contents sections={sections} number={number} className="mt-3" />
          </div>
        </aside>

        <article className="min-w-0">
          <div className="rounded-2xl border-s-4 border-lime bg-white p-5 text-[15px] leading-7 text-zinc-700 shadow-sm ring-1 ring-line sm:p-6">
            {intro}
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-line">
            {sections.map((section, index) => (
              <section
                key={index}
                id={sectionId(index)}
                aria-labelledby={`${sectionId(index)}-title`}
                className="scroll-mt-24 border-line px-5 py-6 not-first:border-t sm:px-8 sm:py-7"
              >
                <h2
                  id={`${sectionId(index)}-title`}
                  className="flex items-center gap-3 text-lg font-semibold tracking-tight"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-mint text-xs font-bold text-brand tabular-nums">
                    {number(index)}
                  </span>
                  {section.title}
                </h2>
                <div className={`mt-3 sm:ps-11 ${prose}`}>{section.body}</div>
              </section>
            ))}
          </div>

          {/* Contact */}
          <div className="relative mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-forest via-forest to-brand p-6 text-white shadow-lg shadow-forest/20 sm:p-8">
            <span
              aria-hidden
              className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-lime/50 to-transparent"
            />
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold">{l.questionsTitle}</p>
                <p className="mt-1 text-sm text-white/70">{l.questionsText}</p>
              </div>
              <a
                href={`mailto:${LEGAL_CONTACT_EMAIL}`}
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-lime px-5 text-sm font-semibold text-on-lime shadow-md transition hover:bg-lime-light hover:text-on-lime"
              >
                <Mail className="size-4" aria-hidden />
                {l.emailUs}
              </a>
            </div>
            <p className="mt-6 border-t border-white/10 pt-4 text-xs text-white/55" dir="auto">
              {company.join(" · ")} · <span dir="ltr">{LEGAL_CONTACT_EMAIL}</span>
            </p>
          </div>

          <p className="mt-6 text-center">
            <a
              href="#top"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-brand"
            >
              <ArrowUp className="size-4" aria-hidden />
              {l.backToTop}
            </a>
          </p>
        </article>
      </div>
    </main>
  );
}

function Contents({
  sections,
  number,
  className = "",
}: {
  sections: LegalSection[];
  number: (index: number) => string;
  className?: string;
}) {
  return (
    <ol className={`flex flex-col gap-0.5 ${className}`}>
      {sections.map((section, index) => (
        <li key={index}>
          <a
            href={`#${sectionId(index)}`}
            className="flex items-baseline gap-2.5 rounded-lg px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-white hover:text-brand lg:hover:ring-1 lg:hover:ring-line"
          >
            <span className="text-xs font-semibold text-zinc-400 tabular-nums">{number(index)}</span>
            <span>{section.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}
