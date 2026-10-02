import { BadgeCheck, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Props = {
  profile: { email_verified_at: string | null; id_verified_at: string | null };
};

export function VerificationBadges({ profile }: Props) {
  if (!profile.email_verified_at && !profile.id_verified_at) return null;

  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {profile.id_verified_at && (
        <Badge variant="secondary" title="Identity checked by our team" className="bg-mint text-brand">
          <BadgeCheck />
          ID verified
        </Badge>
      )}
      {profile.email_verified_at && (
        <Badge variant="outline" className="text-muted-foreground">
          <Mail />
          Email verified
        </Badge>
      )}
    </span>
  );
}
