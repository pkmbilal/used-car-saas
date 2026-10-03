import { Plus } from "lucide-react";

// Keep the answers in sync with how plans work: admin-granted dealer plans,
// the enforce_listing_quota trigger and Riyadh-time quota months.
const FAQS: { q: string; a: string }[] = [
  {
    q: "How do I upgrade?",
    a: "Apply for a dealer plan with your Commercial Registration and other documents. Our team reviews your application, activates your plan and contacts you about payment. You can keep listing on the Free plan in the meantime.",
  },
  {
    q: "How do I pay?",
    a: "Our team contacts you after your application is approved. Online payment with Mada, STC Pay and cards is coming soon.",
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
    q: "Can I change or cancel my plan?",
    a: "Yes. Contact us and our team will move you to another plan.",
  },
];

export function PricingFaq() {
  return (
    <section className="mx-auto mt-14 w-full max-w-3xl">
      <h2 className="text-center text-xl font-medium tracking-tight">Frequently asked questions</h2>
      <div className="mt-6 divide-y divide-line rounded-lg bg-white shadow-[0_2px_10px_rgba(20,30,25,.05)]">
        {FAQS.map(({ q, a }) => (
          <details key={q} className="group px-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
              {q}
              <Plus className="size-4 shrink-0 text-brand transition group-open:rotate-45" />
            </summary>
            <p className="pb-4 text-[0.8125rem] leading-relaxed text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
