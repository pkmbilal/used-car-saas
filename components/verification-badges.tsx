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
          className={`${badgeClass} bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300`}
        >
          ✓ ID verified
        </span>
      )}
      {profile.email_verified_at && (
        <span className={`${badgeClass} bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300`}>
          Email verified
        </span>
      )}
    </span>
  );
}
