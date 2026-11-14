import type { ReactNode } from "react";
import { COMPANY_ADDRESS, COMPANY_CR_NUMBER, COMPANY_NAME, SUPPORT_EMAIL } from "@/lib/contact";
import { fmt } from "@/lib/dictionary";
import { getDictionary } from "@/lib/i18n-server";

export const LEGAL_CONTACT_EMAIL = SUPPORT_EMAIL;

export async function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  const { t, locale } = await getDictionary();
  const details = [
    COMPANY_NAME,
    COMPANY_CR_NUMBER && fmt(t.common.crNumber, { number: COMPANY_CR_NUMBER }),
    COMPANY_ADDRESS?.[locale],
  ].filter(Boolean);
  return (
    <main className="light flex-1 bg-canvas px-4 py-12 text-ink sm:px-6">
      <article className="mx-auto w-full max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{fmt(t.common.lastUpdated, { date: updated })}</p>
        <div className="mt-8 flex flex-col gap-4 text-sm leading-relaxed [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:ps-5 [&_li]:mt-1">
          {children}
        </div>
        {details.length > 1 && (
          <p className="mt-10 border-t border-border pt-4 text-xs text-muted-foreground">{details.join(" · ")}</p>
        )}
      </article>
    </main>
  );
}
