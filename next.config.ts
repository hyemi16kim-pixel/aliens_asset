import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: false,
  },
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
