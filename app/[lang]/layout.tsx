import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { notFound } from "next/navigation";
import { DirectionProvider } from "@/components/direction-provider";
import { I18nProvider } from "@/components/i18n-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import { dictionaries } from "@/lib/dictionaries";
import { figtree, plexArabic, poppins } from "@/lib/fonts";
import { dir, isLocale, LOCALES } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";
import "../globals.css";

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const t = dictionaries[isLocale(lang) ? lang : "ar"];
  return {
    metadataBase: siteUrl(),
    title: t.meta.siteTitle,
    description: t.meta.siteDescription,
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1b2125",
};

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const fonts = lang === "ar" ? [plexArabic.variable] : [figtree.variable, poppins.variable];

  return (
    <html lang={lang} dir={dir(lang)} className={cn("h-full font-sans antialiased", ...fonts)}>
      <body className="min-h-full flex flex-col">
        <DirectionProvider dir={dir(lang)}>
          <I18nProvider t={dictionaries[lang]} locale={lang}>
            <SiteHeader />
            <div className="flex flex-1 flex-col">{children}</div>
            <SiteFooter />
            {/* On phones, toasts sit above the bottom tab bar. */}
            <Toaster
              theme="light"
              dir={dir(lang)}
              mobileOffset={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
            />
          </I18nProvider>
        </DirectionProvider>
        <Analytics />
      </body>
    </html>
  );
}
