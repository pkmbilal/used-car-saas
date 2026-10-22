import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { HideOnAdmin } from "@/components/hide-on-admin";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import { siteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: "KarSouq | Used Cars in Saudi Arabia",
  description: "Buy and sell verified used cars in Saudi Arabia",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1b2125",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("h-full font-sans antialiased", figtree.variable)}>
      <body className="min-h-full flex flex-col">
        <HideOnAdmin>
          <SiteHeader />
        </HideOnAdmin>
        <div className="flex flex-1 flex-col">{children}</div>
        <HideOnAdmin>
          <SiteFooter />
        </HideOnAdmin>
        {/* On phones, toasts sit above the bottom tab bar. */}
        <Toaster theme="light" mobileOffset={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }} />
      </body>
    </html>
  );
}
