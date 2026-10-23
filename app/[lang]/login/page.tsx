import { AuthShell } from "@/components/auth-shell";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { localeRedirect } from "@/lib/i18n-server";

export default async function LoginPage({ searchParams }: PageProps<"/[lang]/login">) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) return localeRedirect(next);

  return (
    <AuthShell
      eyebrow="WELCOME BACK"
      title="Sign in to KarSouq"
      subtitle="Pick up where you left off with your saved cars and listings."
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
