import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: false,
  },
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  serverExternalPackages: ["@capacitor/core", "@capacitor/android", "@capacitor/cli"],
};

export default nextConfig;
