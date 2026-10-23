import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import { figtree, poppins } from "@/lib/fonts";
import { siteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";
import "../globals.css";

// The admin panel is its own root layout: English, full screen, no site
// header or footer.
export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: "Admin | KarSouq",
  robots: { index: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1b2125",
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="en" dir="ltr" className={cn("h-full font-sans antialiased", figtree.variable, poppins.variable)}>
      <body className="min-h-full flex flex-col">
        <div className="flex flex-1 flex-col">{children}</div>
        <Toaster theme="light" mobileOffset={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }} />
      </body>
    </html>
  );
}
