import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Mail, MessageCircle } from "lucide-react";
import { salesWhatsappUrl, SUPPORT_EMAIL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Contact Us | KarSouq",
  description: "Get in touch with the KarSouq team about your account, listings or dealer plans.",
};

export default function ContactPage() {
  const whatsapp = salesWhatsappUrl("Hi, I have a question about KarSouq.");

  return (
    <main className="light flex-1 bg-canvas px-4 py-12 text-ink sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">Contact us</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Questions about your account, a listing or a dealer plan? We usually reply within one business day. To
          report a problem with a specific listing, use the Report link on the listing page.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <ContactCard
            icon={<Mail className="size-5 text-brand" />}
            title="Email"
            label={SUPPORT_EMAIL}
            href={`mailto:${SUPPORT_EMAIL}`}
          />
          {whatsapp && (
            <ContactCard
              icon={<MessageCircle className="size-5 text-brand" />}
              title="WhatsApp"
              label="Chat with our team"
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
