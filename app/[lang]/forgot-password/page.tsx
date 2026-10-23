import { AuthShell } from "@/components/auth-shell";
import { safeNext } from "@/lib/auth";
import { ResetForm } from "./reset-form";

// No signed-in redirect: after the code step the user is signed in but still
// needs to finish choosing a password on this page.
export default async function ForgotPasswordPage({
  searchParams,
}: PageProps<"/[lang]/forgot-password">) {
  const next = safeNext((await searchParams).next);

  return (
    <AuthShell
      eyebrow="ACCOUNT RECOVERY"
      title="Reset your password"
      subtitle="We'll email you a code to choose a new one."
    >
      <ResetForm next={next} />
    </AuthShell>
  );
}
