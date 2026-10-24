import Link from "@/components/locale-link";
import { ArrowRight, MapPin } from "lucide-react";
import { DealerBadge, DealerLogo } from "@/components/dealer-logo";
import { VerificationBadges } from "@/components/verification-badges";
import { Card } from "@/components/ui/card";
import { cityName, count, fmt } from "@/lib/dictionary";
import { formatMonthYear } from "@/lib/format";
import { getDictionary } from "@/lib/i18n-server";
import type { DealerSummary } from "@/lib/storefront";

export async function DealerCard({ dealer }: { dealer: DealerSummary }) {
  const { t, locale } = await getDictionary();
  const { storefront, profile, activeListings } = dealer;

  return (
    <Card className="group h-full gap-0 rounded-lg py-0 text-ink shadow-[0_2px_10px_rgba(20,30,25,.05)] ring-0 transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(20,30,25,.1)]">
      <Link href={`/sellers/${dealer.id}`} className="flex h-full flex-col p-5 hover:text-ink">
        <div className="flex items-start gap-4">
          <DealerLogo name={storefront.name} logoUrl={storefront.logoUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{storefront.name}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <DealerBadge />
              <VerificationBadges profile={profile} />
            </div>
          </div>
        </div>
        {storefront.about && (
          <p className="mt-4 line-clamp-2 text-label text-muted-foreground">{storefront.about}</p>
        )}
        <div className="mt-auto flex items-center gap-4 pt-4 text-caption text-muted-foreground">
          {profile.city && (
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3" />
              {cityName(t, profile.city)}
            </span>
          )}
          <span>{fmt(t.common.since, { date: formatMonthYear(profile.created_at, locale) })}</span>
          <span className="ms-auto font-semibold text-ink">
            {count(locale, activeListings, t.common.cars)}
          </span>
          <span className="flex size-5 items-center justify-center rounded-full border border-ink/80 transition group-hover:border-brand group-hover:bg-brand group-hover:text-white">
            <ArrowRight className="size-2.5" strokeWidth={2.6} />
          </span>
        </div>
      </Link>
    </Card>
  );
}
