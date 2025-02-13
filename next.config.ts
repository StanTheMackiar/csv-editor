import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false,
  productionBrowserSourceMaps: true,
  experimental: {
    turbo: {
      rules: {},
    },
  },
};

export default nextConfig;
