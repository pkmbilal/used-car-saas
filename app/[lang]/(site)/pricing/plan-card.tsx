import Link from "@/components/locale-link";
import { Check } from "lucide-react";
import { limeButton } from "@/components/header-styles";
import { RiyalPrice } from "@/components/riyal-price";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n-server";
import type { Plan, PlanDetails } from "@/lib/plans";
import { cn } from "@/lib/utils";

export type PlanCta = { label: string; href: string } | { label: string; disabled: true } | null;

export async function PlanCard({ plan, details, cta }: { plan: Plan; details: PlanDetails; cta: PlanCta }) {
  const { t } = await getDictionary();
  const copy = t.plans.details[plan];
  const buttonClass = "h-10 w-full text-label font-semibold";

  return (
    <Card
      className={cn(
        "h-full gap-0 rounded-lg p-6 text-ink shadow-[0_2px_10px_rgba(20,30,25,.05)] ring-0",
        details.highlighted && "ring-2 ring-brand",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{t.plans.labels[plan]}</h2>
        {details.highlighted && (
          <span className="rounded-full bg-brand px-2.5 py-0.5 text-caption font-bold tracking-wide text-white">
            {t.pricing.mostPopular}
          </span>
        )}
      </div>
      <p className="mt-1 text-label text-muted-foreground">{copy.tagline}</p>
      <p className="mt-5 flex items-baseline gap-1.5">
        {details.price === 0 ? (
          <span className="text-3xl font-semibold tracking-tight">{t.pricing.free}</span>
        ) : (
          <>
            <RiyalPrice amount={details.price} className="text-3xl font-semibold tracking-tight" />
            <span className="text-label text-muted-foreground">{t.pricing.perMonth}</span>
          </>
        )}
      </p>

      <ul className="mt-6 flex flex-col gap-2.5 text-label">
        {copy.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={2.6} />
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-8">
        {cta &&
          ("href" in cta ? (
            <Button
              asChild
              variant={details.highlighted ? "default" : "outline"}
              className={cn(details.highlighted && limeButton, buttonClass)}
            >
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          ) : (
            <Button variant="outline" disabled className={buttonClass}>
              {cta.label}
            </Button>
          ))}
      </div>
    </Card>
  );
}
