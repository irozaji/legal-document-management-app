import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    // This is a simpler approach that doesn't rely on require.resolve
    return config;
  },
};

export default nextConfig;
