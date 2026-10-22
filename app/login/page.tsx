import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next);

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
