/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    }, {
      source: '/admin/:path*',
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
    }, {
      source: '/api/:path*',
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
    }];
  },
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
