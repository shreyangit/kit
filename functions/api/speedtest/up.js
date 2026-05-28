// Cloudflare Pages Function: /api/speedtest/up
// Drains the POSTed request body at the edge and reports how many bytes were
// received. Used by the Network Speed Test tool to measure upload throughput.
// The client times how long it takes to push the body, so the body is read and
// discarded as fast as possible without buffering it all in memory.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Timing-Allow-Origin": "*",
};

export async function onRequest(context) {
  const { request } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  let received = 0;
  try {
    if (request.body) {
      const reader = request.body.getReader();
      // Read and discard. Counting here is a safety net; the authoritative
      // measurement is the client's upload-progress timing.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) received += value.length;
      }
    } else {
      const buf = await request.arrayBuffer();
      received = buf.byteLength;
    }
  } catch {
    // client aborted mid-upload — fine, return what we got
  }

  return new Response(JSON.stringify({ bytes: received }), {
    headers: {
      ...CORS,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
