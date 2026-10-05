import type { ReactNode } from "react";
import { Plus } from "lucide-react";

// Keep the answers in sync with how plans work: admin-granted dealer plans,
// the enforce_listing_quota trigger, feature_listing's allowance and
// Riyadh-time quota months.
function faqs(contact: ReactNode): { q: string; a: ReactNode }[] {
  return [
    {
      q: "How do I upgrade?",
      a: "Apply for a dealer plan with your Commercial Registration and other documents. Our team reviews your application, activates your plan and contacts you about payment. You can keep listing on the Free plan in the meantime.",
    },
    {
      q: "How do I pay?",
      a: (
        <>
          Our team contacts you after your application is approved. Online payment with Mada, STC
          Pay and cards is coming soon. If you have questions about payment, {contact}.
        </>
      ),
    },
    {
      q: "What counts as a listing?",
      a: "Every listing you create, drafts included, uses one of your monthly listings. Deleting a listing doesn't give it back.",
    },
    {
      q: "When does my limit reset?",
      a: "On the 1st of each month, Saudi time.",
    },
    {
      q: "What happens if I reach my limit?",
      a: "Your existing listings stay live. You can add new ones again next month, or right away if you upgrade.",
    },
    {
      q: "How do featured listings work?",
      a: (
        <>
          Featured listings are shown above other results in search. Pro includes 3 and Showroom 10
          featured listings a month, and extending a featured listing in the same month doesn&apos;t
          use another one. On other plans you can buy a featured placement: {contact}.
        </>
      ),
    },
    {
      q: "Can I change or cancel my plan?",
      a: <>Yes, just {contact} and our team will move you to another plan.</>,
    },
  ];
}

export function PricingFaq({ salesUrl }: { salesUrl: string | null }) {
  const contact = salesUrl ? (
    <a href={salesUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-brand underline">
      contact us on WhatsApp
    </a>
  ) : (
    "contact us"
  );

  return (
    <section className="mx-auto mt-14 w-full max-w-3xl">
      <h2 className="text-center text-xl font-medium tracking-tight">Frequently asked questions</h2>
      <div className="mt-6 divide-y divide-line rounded-lg bg-white shadow-[0_2px_10px_rgba(20,30,25,.05)]">
        {faqs(contact).map(({ q, a }) => (
          <details key={q} className="group px-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
              {q}
              <Plus className="size-4 shrink-0 text-brand transition group-open:rotate-45" />
            </summary>
            <p className="pb-4 text-label leading-relaxed text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
