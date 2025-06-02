import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true // 构建时跳过 ESLint
  }
};

export default nextConfig;
