import Link from "next/link";
import { Check } from "lucide-react";
import { limeButton } from "@/components/header-styles";
import { RiyalPrice } from "@/components/riyal-price";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PLAN_LABELS, type Plan, type PlanDetails } from "@/lib/plans";
import { cn } from "@/lib/utils";

export type PlanCta = { label: string; href: string } | { label: string; disabled: true } | null;

export function PlanCard({ plan, details, cta }: { plan: Plan; details: PlanDetails; cta: PlanCta }) {
  const buttonClass = "h-10 w-full text-[0.8125rem] font-semibold";

  return (
    <Card
      className={cn(
        "h-full gap-0 rounded-lg p-6 text-ink shadow-[0_2px_10px_rgba(20,30,25,.05)] ring-0",
        details.highlighted && "ring-2 ring-brand",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{PLAN_LABELS[plan]}</h2>
        {details.highlighted && (
          <span className="rounded-full bg-brand px-2.5 py-0.5 text-[0.6875rem] font-bold tracking-wide text-white">
            Most popular
          </span>
        )}
      </div>
      <p className="mt-1 text-[0.8125rem] text-muted-foreground">{details.tagline}</p>
      <p className="mt-5 flex items-baseline gap-1.5">
        {details.price === 0 ? (
          <span className="text-3xl font-semibold tracking-tight">Free</span>
        ) : (
          <>
            <RiyalPrice amount={details.price} className="text-3xl font-semibold tracking-tight" />
            <span className="text-[0.8125rem] text-muted-foreground">/ month</span>
          </>
        )}
      </p>

      <ul className="mt-6 flex flex-col gap-2.5 text-[0.8125rem]">
        {details.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 text-brand" strokeWidth={2.6} />
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
