import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { SignupForm } from "./signup-form";
import { getDictionary, localeRedirect } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.authPages.signup.metaTitle };
}

export default async function SignupPage({ searchParams }: PageProps<"/[lang]/signup">) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) return localeRedirect(next);
  const { t } = await getDictionary();
  const p = t.authPages.signup;

  return (
    <AuthShell
      eyebrow={p.eyebrow}
      title={p.title}
      subtitle={p.subtitle}
    >
      <SignupForm next={next} />
    </AuthShell>
  );
}
