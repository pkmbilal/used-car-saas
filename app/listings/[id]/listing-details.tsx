import type { ReactNode } from "react";

// Spec tiles, a features list and a free-text description for the listing
// page. Features and description render nothing when the listing has none.

export type Spec = { label: string; value: string | null | undefined; icon: ReactNode };

export function SpecGrid({ specs }: { specs: Spec[] }) {
  const shown = specs.filter((spec): spec is Spec & { value: string } => Boolean(spec.value));

  return (
    <section>
      <h2 className="text-lg font-semibold">Overview</h2>
      <dl className="mt-4 grid grid-cols-2 border-t border-line sm:grid-cols-4">
        {shown.map((spec) => (
          <div key={spec.label} className="flex items-center gap-3 border-b border-line py-4 pr-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-mint text-brand">
              {spec.icon}
            </span>
            <div className="min-w-0">
              <dt className="text-[11.5px] text-muted-foreground">{spec.label}</dt>
              <dd className="mt-0.5 truncate text-[13px] font-semibold">{spec.value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ListingFeatures({ features }: { features?: string[] | null }) {
  if (!features?.length) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold">Features</h2>
      <ul className="mt-4 grid gap-x-5 gap-y-3 sm:grid-cols-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-3 text-xs text-ink/85">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-mint text-brand-600">✓</span>
            {feature}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ListingDescription({ text }: { text?: string | null }) {
  if (!text?.trim()) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold">Description</h2>
      <p className="mt-3 max-w-xl text-[13px] leading-relaxed whitespace-pre-line text-ink/75">{text}</p>
    </section>
  );
}
