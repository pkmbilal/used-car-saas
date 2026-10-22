import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { SignupForm } from "./signup-form";

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next);

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
