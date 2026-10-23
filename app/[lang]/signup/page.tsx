import { AuthShell } from "@/components/auth-shell";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { SignupForm } from "./signup-form";
import { localeRedirect } from "@/lib/i18n-server";

export default async function SignupPage({ searchParams }: PageProps<"/[lang]/signup">) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) return localeRedirect(next);

  return (
    <AuthShell
      eyebrow="JOIN KARSOUQ"
      title="Create your account"
      subtitle="Buy and sell used cars across Saudi Arabia."
    >
      <SignupForm next={next} />
    </AuthShell>
  );
}
