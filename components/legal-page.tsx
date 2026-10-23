import type { ReactNode } from "react";
import { SUPPORT_EMAIL } from "@/lib/contact";

export const LEGAL_CONTACT_EMAIL = SUPPORT_EMAIL;

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="light flex-1 bg-canvas px-4 py-12 text-ink sm:px-6">
      <article className="mx-auto w-full max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated {updated}</p>
        <div className="mt-8 flex flex-col gap-4 text-sm leading-relaxed [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:ps-5 [&_li]:mt-1">
          {children}
        </div>
      </article>
    </main>
  );
}
