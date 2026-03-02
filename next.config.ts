import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

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

export default withPWA(nextConfig);
