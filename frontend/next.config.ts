import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    domains: [], // Allow images from any domain
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow images from any hostname
        port: '',
        pathname: '/**', // Allow any path
      },
    ],
  },
};

export default nextConfig;
