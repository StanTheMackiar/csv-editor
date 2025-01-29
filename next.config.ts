import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false,
  productionBrowserSourceMaps: true,
  output: 'export',
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.devtool = 'source-map';
    }
    return config;
  },
};

export default nextConfig;
