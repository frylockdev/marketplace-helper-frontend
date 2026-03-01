import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Docker standalone output (copies only necessary files to .next/standalone)
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.wildberries.ru" },
      { protocol: "https", hostname: "basket-*.wbbasket.ru" },
    ],
  },
};

export default nextConfig;
