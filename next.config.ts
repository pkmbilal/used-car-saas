import type { NextConfig } from "next";

// Listing photos are served from R2_PUBLIC_URL (the custom domain media.karsouq.com).
const r2PublicUrl = process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL) : null;

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
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
    ],
  },
};

export default nextConfig;
