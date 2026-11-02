import type { MetadataRoute } from "next";
import { dictionaries } from "@/lib/dictionaries";

// Served at /manifest.webmanifest. start_url "/" lets the proxy pick the
// user's saved language, so one manifest covers both locales.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "KarSouq | كارسوق",
    short_name: "KarSouq",
    description: dictionaries.ar.meta.siteDescription,
    lang: "ar",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1b2125",
    theme_color: "#1b2125",
    categories: ["shopping", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
