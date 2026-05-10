import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { toolId, rating, comment, type } = body;
    if (!toolId || !type) {
      return Response.json({ error: "toolId and type are required" }, { status: 400 });
    }
    // Log to console for now — in production this fires a Cloudflare Worker
    console.log("[feedback]", { toolId, rating, comment, type, ts: Date.now(), ua: req.headers.get("user-agent") });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
}
