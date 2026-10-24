import Link from "@/components/locale-link";
import { Plus } from "lucide-react";
import { rich } from "@/components/rich-text";
import { getDictionary } from "@/lib/i18n-server";

// The answers live in the dictionaries (pricing.faqs). Keep them in sync with
// how plans work: admin-granted dealer plans, the enforce_listing_quota
// trigger, feature_listing's allowance and Riyadh-time quota months.
export async function PricingFaq({ salesUrl }: { salesUrl: string | null }) {
  const { t } = await getDictionary();
  const contact = salesUrl ? (
    <a href={salesUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-brand underline">
      {t.pricing.contactWhatsapp}
    </a>
  ) : (
    <Link href="/contact" className="font-medium text-brand underline">
      {t.pricing.contactUs}
    </Link>
  );

  return (
    <section className="mx-auto mt-14 w-full max-w-3xl">
      <h2 className="text-center text-xl font-medium tracking-tight">{t.pricing.faqTitle}</h2>
      <div className="mt-6 divide-y divide-line rounded-lg bg-white shadow-[0_2px_10px_rgba(20,30,25,.05)]">
        {t.pricing.faqs.map(({ q, a }) => (
          <details key={q} className="group px-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
              {q}
              <Plus className="size-4 shrink-0 text-brand transition group-open:rotate-45" />
            </summary>
            <p className="pb-4 text-label leading-relaxed text-muted-foreground">{rich(a, { contact })}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
