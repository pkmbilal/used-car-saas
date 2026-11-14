import Link from "@/components/locale-link";
import { Check, Clock } from "lucide-react";
import { limeButton } from "@/components/header-styles";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type PlanCta = { label: string; href: string } | { label: string; disabled: true } | null;

export type PlanCardProps = {
  name: string;
  tagline: string;
  price: string;
  priceNote?: string;
  badge?: string;
  features: readonly string[];
  highlighted?: boolean;
  comingSoon?: boolean; // features listed as not available yet
  cta: PlanCta;
};

export function PlanCard({
  name,
  tagline,
  price,
  priceNote,
  badge,
  features,
  highlighted,
  comingSoon,
  cta,
}: PlanCardProps) {
  const buttonClass = "h-10 w-full text-label font-semibold";
  const Icon = comingSoon ? Clock : Check;

  return (
    <Card
      className={cn(
        "h-full gap-0 rounded-lg p-6 text-ink shadow-[0_2px_10px_rgba(20,30,25,.05)] ring-0",
        highlighted && "ring-2 ring-brand",
        comingSoon && "bg-canvas",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{name}</h2>
        {badge && (
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-caption font-bold tracking-wide",
              comingSoon ? "bg-zinc-200 text-zinc-700" : "bg-brand text-white",
            )}
          >
            {badge}
          </span>
        )}
      </div>
      <p className="mt-1 text-label text-muted-foreground">{tagline}</p>
      <p className="mt-5 flex flex-wrap items-baseline gap-x-1.5">
        <span className={cn("text-3xl font-semibold tracking-tight", comingSoon && "text-muted-foreground")}>
          {price}
        </span>
        {priceNote && <span className="text-label text-muted-foreground">{priceNote}</span>}
      </p>

      <ul className={cn("mt-6 flex flex-col gap-2.5 text-label", comingSoon && "text-muted-foreground")}>
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Icon
              className={cn("mt-0.5 size-4 shrink-0", comingSoon ? "text-zinc-400" : "text-brand")}
              strokeWidth={2.6}
            />
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-8">
        {cta &&
          ("href" in cta ? (
            <Button
              asChild
              variant={highlighted ? "default" : "outline"}
              className={cn(highlighted && limeButton, buttonClass)}
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
