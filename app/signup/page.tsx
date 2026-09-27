import { redirect } from "next/navigation";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { SignupForm } from "./signup-form";

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next);

  return (
    <main className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Create your account</h1>
      <SignupForm next={next} />
    </main>
  );
}
