import type { NextConfig } from "next";

// Listing photos are served from the R2 public URL (r2.dev or custom domain).
const r2PublicUrl = process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL) : null;

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      ...(r2PublicUrl
        ? [
            {
              protocol: r2PublicUrl.protocol === "http:" ? ("http" as const) : ("https" as const),
              hostname: r2PublicUrl.hostname,
            },
          ]
        : []),
      // Make logos on the home page's brand tiles.
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/filippofilip95/car-logos-dataset/**",
      },
    ],
  },
};

export default nextConfig;
