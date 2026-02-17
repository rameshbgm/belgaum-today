import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.hindustantimes.com',
        pathname: '/ht-img/**',
      },
      {
        protocol: 'https',
        hostname: 'www.hindustantimes.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'images.hindustantimes.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'th-i.thgim.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
