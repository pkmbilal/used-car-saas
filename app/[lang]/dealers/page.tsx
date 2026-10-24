import type { Metadata } from "next";
import { DealerCard } from "@/components/dealer-card";
import { count } from "@/lib/dictionary";
import { getDictionary, localeAlternates } from "@/lib/i18n-server";
import { getDealerStorefronts } from "@/lib/storefront";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return {
    title: t.dealers.metaTitle,
    description: t.dealers.metaDescription,
    alternates: await localeAlternates("/dealers"),
  };
}

export default async function DealersPage() {
  const dealers = await getDealerStorefronts();
  const { t, locale } = await getDictionary();
  const d = t.dealers;

  return (
    <main className="light bg-canvas text-ink">
      <section className="relative overflow-hidden bg-charcoal">
        <div className="absolute inset-y-0 end-0 w-2/3 bg-[radial-gradient(ellipse_at_70%_60%,rgba(111,224,124,.16),transparent_60%)] rtl:bg-[radial-gradient(ellipse_at_30%_60%,rgba(111,224,124,.16),transparent_60%)]" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-10 pb-14 sm:px-6">
          <p className="text-eyebrow font-bold tracking-[0.24em] text-[#5fd06e]">{d.eyebrow}</p>
          <h1 className="mt-2.5 max-w-md text-3xl leading-tight font-medium tracking-tight text-white md:text-4xl">
            {d.titleStart} <span className="text-lime">{d.titleHighlight}</span>
          </h1>
          <p className="mt-3.5 max-w-sm text-label leading-relaxed text-white/85">
            {d.intro}
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <p className="mb-4 text-label font-semibold">
          {count(locale, dealers.length, d.count)}
        </p>
        {dealers.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">{d.empty}</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {dealers.map((dealer) => (
              <li key={dealer.id}>
                <DealerCard dealer={dealer} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
