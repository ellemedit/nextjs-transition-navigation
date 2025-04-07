import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
    ppr: true,
    useCache: true,
  },
};

export default nextConfig;
