/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: false,
  },
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  serverExternalPackages: ['@capacitor/core', '@capacitor/android', '@capacitor/cli'],
};

export default nextConfig;
