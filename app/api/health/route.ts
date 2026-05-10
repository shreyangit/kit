export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    status: "ok",
    tools: 90,
    timestamp: Date.now(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
  });
}
