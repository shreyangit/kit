// Cloudflare Pages Function: /api/feedback
// Replaces app/api/feedback/route.ts which cannot work in static export mode.
// Logs feedback to Cloudflare logpush / future KV integration.

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });
  }

  if (context.request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await context.request.json();
    const { toolId, rating, comment, type, contact } = body;

    if (!toolId || !type) {
      return Response.json({ error: "toolId and type are required" }, { status: 400 });
    }

    // Log via console (visible in CF Pages logs dashboard)
    console.log(JSON.stringify({
      event: "feedback",
      toolId,
      rating: rating ?? null,
      type,
      comment: comment ? comment.slice(0, 500) : null,
      contact: contact ?? null,
      ts: Date.now(),
      country: context.request.cf?.country ?? "unknown",
    }));

    // Future: store in KV
    // if (context.env.FEEDBACK_KV) {
    //   await context.env.FEEDBACK_KV.put(`${Date.now()}-${toolId}`, JSON.stringify(body));
    // }

    return Response.json({ ok: true }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      }
    });
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
}
