import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker production builds
  // This creates a minimal production bundle with all dependencies included
  output: "standalone",

  // Disable telemetry in production
  // Set via NEXT_TELEMETRY_DISABLED=1 env var as well
};

export default nextConfig;
