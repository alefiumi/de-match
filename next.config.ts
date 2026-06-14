import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict security headers applied via Vercel + middleware
  // See: middleware.ts and vercel.json
  experimental: {
    // Enables React 19 features
    reactCompiler: false,
  },
};

export default nextConfig;
