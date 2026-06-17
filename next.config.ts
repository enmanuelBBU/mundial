import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    FOOTBALL_API_KEY: process.env.FOOTBALL_API_KEY,
  },
};

export default nextConfig;
