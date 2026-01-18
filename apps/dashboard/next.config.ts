import type { NextConfig } from "next";

// Debug: Log loaded env files and JWT_SECRET presence
console.log("[next.config.ts] JWT_SECRET loaded:", !!process.env.JWT_SECRET);
console.log("[next.config.ts] JWT_SECRET first 10 chars:", process.env.JWT_SECRET?.slice(0, 10));
console.log("[next.config.ts] NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL);

const nextConfig: NextConfig = {
  // Enable standalone output for Docker production builds
  // This creates a minimal production bundle with all dependencies included
  output: "standalone",

  // Increase body size limit for Server Actions (file uploads)
  // Default is 1MB, we need 10MB for product images
  // @see Story 3.3 - Product Media Upload
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  // Allow images from R2/S3 storage and CDN
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      {
        protocol: "https",
        hostname: "*.cloudflare.com",
      },
      {
        protocol: "https",
        hostname: "cdn.trafi.io",
      },
    ],
  },

  // Disable telemetry in production
  // Set via NEXT_TELEMETRY_DISABLED=1 env var as well
};

export default nextConfig;
