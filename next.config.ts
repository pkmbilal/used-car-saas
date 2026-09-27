import type { NextConfig } from "next";

// Listing photos are served from the R2 public URL (r2.dev or custom domain).
const r2PublicUrl = process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL) : null;

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: r2PublicUrl
      ? [
          {
            protocol: r2PublicUrl.protocol === "http:" ? "http" : "https",
            hostname: r2PublicUrl.hostname,
          },
        ]
      : [],
  },
};

export default nextConfig;
