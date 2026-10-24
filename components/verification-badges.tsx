import { BadgeCheck, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getDictionary } from "@/lib/i18n-server";

type Props = {
  profile: { email_verified_at: string | null; id_verified_at: string | null };
};

export async function VerificationBadges({ profile }: Props) {
  if (!profile.email_verified_at && !profile.id_verified_at) return null;
  const { t } = await getDictionary();

  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {profile.id_verified_at && (
        <Badge variant="secondary" title={t.verification.idVerifiedTitle} className="bg-mint text-brand">
          <BadgeCheck />
          {t.verification.idVerified}
        </Badge>
      )}
      {profile.email_verified_at && (
        <Badge variant="outline" className="text-muted-foreground">
          <Mail />
          {t.verification.emailVerified}
        </Badge>
      )}
    </span>
  );
}
