import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Mail, MessageCircle } from "lucide-react";
import { salesWhatsappUrl, SUPPORT_EMAIL } from "@/lib/contact";
import { getDictionary } from "@/lib/i18n-server";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return pageMetadata({ title: t.contact.metaTitle, description: t.contact.metaDescription, path: "/contact" });
}

export default async function ContactPage() {
  const { t } = await getDictionary();
  const c = t.contact;
  const whatsapp = salesWhatsappUrl(c.whatsappText);

  return (
    <main className="light flex-1 bg-canvas px-4 py-12 text-ink sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">{c.title}</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {c.intro}
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <ContactCard
            icon={<Mail className="size-5 text-brand" />}
            title={c.email}
            label={SUPPORT_EMAIL}
            href={`mailto:${SUPPORT_EMAIL}`}
          />
          {whatsapp && (
            <ContactCard
              icon={<MessageCircle className="size-5 text-brand" />}
              title={c.whatsapp}
              label={c.chat}
              href={whatsapp}
              external
            />
          )}
        </div>
      </div>
    </main>
  );
}

function ContactCard({
  icon,
  title,
  label,
  href,
  external = false,
}: {
  icon: ReactNode;
  title: string;
  label: string;
  href: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex items-center gap-4 rounded-xl bg-white p-5 text-ink ring-1 ring-line/60 transition hover:text-ink hover:ring-brand"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-mint">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block truncate text-caption text-muted-foreground">{label}</span>
      </span>
    </a>
  );
}
