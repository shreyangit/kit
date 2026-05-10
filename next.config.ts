import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // API routes are handled by Cloudflare Pages Functions in /functions/
  // See functions/api/feedback.js and functions/api/health.js
};

export default nextConfig;
