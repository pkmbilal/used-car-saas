import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { getDictionary, localeRedirect } from "@/lib/i18n-server";
import { noIndex } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.authPages.login.metaTitle, robots: noIndex };
}

export default async function LoginPage({ searchParams }: PageProps<"/[lang]/login">) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) return localeRedirect(next);
  const { t } = await getDictionary();
  const p = t.authPages.login;

  return (
    <AuthShell
      eyebrow={p.eyebrow}
      title={p.title}
      subtitle={p.subtitle}
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
