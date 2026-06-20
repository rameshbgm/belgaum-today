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
      {
        protocol: 'https',
        hostname: '**.ndtvimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.ndtv.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.firstpost.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.indianexpress.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.oneindia.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.indiatimes.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.thehindu.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
