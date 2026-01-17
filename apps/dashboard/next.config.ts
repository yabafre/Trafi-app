import type { NextConfig } from "next";

// Debug: Log loaded env files and JWT_SECRET presence
console.log("[next.config.ts] JWT_SECRET loaded:", !!process.env.JWT_SECRET);
console.log("[next.config.ts] JWT_SECRET first 10 chars:", process.env.JWT_SECRET?.slice(0, 10));
console.log("[next.config.ts] NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL);

const nextConfig: NextConfig = {
  // Enable standalone output for Docker production builds
  // This creates a minimal production bundle with all dependencies included
  output: "standalone",

  // Disable telemetry in production
  // Set via NEXT_TELEMETRY_DISABLED=1 env var as well
};

export default nextConfig;
