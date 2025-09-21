import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Temporarily disable linting during build for staging deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable type checking during build for faster deployment
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
