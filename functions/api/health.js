// Cloudflare Pages Function: /api/health
// Replaces app/api/health/route.ts which cannot work in static export mode.
// Deployed automatically by Cloudflare Pages alongside the static site.

export async function onRequest(context) {
  return Response.json({
    status: "ok",
    timestamp: Date.now(),
    version: context.env.CF_PAGES_COMMIT_SHA?.slice(0, 7) ?? "unknown",
  }, {
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    }
  });
}
