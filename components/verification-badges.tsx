type Props = {
  profile: { email_verified_at: string | null; id_verified_at: string | null };
};

const badgeClass = "rounded-full px-2 py-0.5 text-xs font-medium";

export function VerificationBadges({ profile }: Props) {
  if (!profile.email_verified_at && !profile.id_verified_at) return null;

  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {profile.id_verified_at && (
        <span
          title="Identity checked by our team"
          className={`${badgeClass} bg-mint text-brand`}
        >
          ✓ ID verified
        </span>
      )}
      {profile.email_verified_at && (
        <span className={`${badgeClass} bg-canvas text-muted ring-1 ring-line`}>
          Email verified
        </span>
      )}
    </span>
  );
}
