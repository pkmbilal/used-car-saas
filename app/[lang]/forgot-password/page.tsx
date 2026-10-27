import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { getDictionary } from "@/lib/i18n-server";
import { safeNext } from "@/lib/auth";
import { ResetForm } from "./reset-form";
import { noIndex } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.authPages.reset.metaTitle, robots: noIndex };
}

// No signed-in redirect: after the code step the user is signed in but still
// needs to finish choosing a password on this page.
export default async function ForgotPasswordPage({
  searchParams,
}: PageProps<"/[lang]/forgot-password">) {
  const next = safeNext((await searchParams).next);
  const { t } = await getDictionary();
  const p = t.authPages.reset;

  return (
    <AuthShell
      eyebrow={p.eyebrow}
      title={p.title}
      subtitle={p.subtitle}
    >
      <ResetForm next={next} />
    </AuthShell>
  );
}
