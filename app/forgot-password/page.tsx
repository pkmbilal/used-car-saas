import { safeNext } from "@/lib/auth";
import { ResetForm } from "./reset-form";

// No signed-in redirect: after the code step the user is signed in but still
// needs to finish choosing a password on this page.
export default async function ForgotPasswordPage({
  searchParams,
}: PageProps<"/forgot-password">) {
  const next = safeNext((await searchParams).next);

  return (
    <main className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Reset your password</h1>
      <ResetForm next={next} />
    </main>
  );
}
