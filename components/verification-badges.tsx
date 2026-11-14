import { BadgeCheck, Mail, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getDictionary } from "@/lib/i18n-server";
import type { Responsiveness } from "@/lib/responsiveness";

type Props = {
  profile: { email_verified_at: string | null; id_verified_at: string | null };
  // From getResponseStats(); the badge shows only when it is earned.
  responsive?: Responsiveness;
  // Approved dealer (CR checked): shows "Verified dealer" in place of the
  // weaker "Email verified" pill.
  dealer?: boolean;
};

export async function VerificationBadges({ profile, responsive, dealer = false }: Props) {
  const showResponsive = !!responsive?.badge;
  if (!dealer && !profile.email_verified_at && !profile.id_verified_at && !showResponsive) return null;
  const { t } = await getDictionary();
  const v = t.verification;

  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {dealer && (
        <Badge title={t.common.verifiedShowroomTitle} className="bg-brand text-white">
          <BadgeCheck />
          {t.common.verifiedShowroom}
        </Badge>
      )}
      {profile.id_verified_at && (
        <Badge variant="secondary" title={v.idVerifiedTitle} className="bg-mint text-brand">
          <BadgeCheck />
          {v.idVerified}
        </Badge>
      )}
      {showResponsive && (
        <Badge
          variant="secondary"
          title={responsive?.bucket ? v.repliesWithin[responsive.bucket] : undefined}
          className="bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300"
        >
          <Zap />
          {v.responsive}
        </Badge>
      )}
      {!dealer && profile.email_verified_at && (
        <Badge variant="outline" className="text-muted-foreground">
          <Mail />
          {v.emailVerified}
        </Badge>
      )}
    </span>
  );
}
