import { Figtree, IBM_Plex_Sans_Arabic, Poppins } from "next/font/google";

export const figtree = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Rounded display face for large headings.
export const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// The sans face on Arabic pages, in place of Figtree (see globals.css).
export const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-sans",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});
