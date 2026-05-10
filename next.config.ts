import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: removed output: "export" to enable API routes (/api/feedback, /api/health)
  // Vercel handles SSR natively — no static export needed
};

export default nextConfig;
