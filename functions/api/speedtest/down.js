// Cloudflare Pages Function: /api/speedtest/down
// Streams `bytes` of incompressible data from the nearest Cloudflare edge node.
// Used by the Network Speed Test tool to measure download throughput.
//
// Why this is accurate: the response is generated at the edge (close to the
// user) and streamed without compression, so the bytes that cross the wire
// equal the bytes requested. This mirrors how speed.cloudflare.com works.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Timing-Allow-Origin": "*",
};

const MAX_BYTES = 250 * 1024 * 1024; // 250 MB hard cap per request
const CHUNK = 65536; // 64 KB — the max size crypto.getRandomValues accepts

// A single random 64 KB block, reused for every chunk. Random (not zeros) so
// no proxy on the path can transparently compress the payload.
let RANDOM_BLOCK = null;
function randomBlock() {
  if (!RANDOM_BLOCK) {
    RANDOM_BLOCK = new Uint8Array(CHUNK);
    crypto.getRandomValues(RANDOM_BLOCK);
  }
  return RANDOM_BLOCK;
}

export async function onRequest(context) {
  const { request } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  const url = new URL(request.url);
  let bytes = parseInt(url.searchParams.get("bytes") ?? "1048576", 10);
  if (!Number.isFinite(bytes) || bytes < 0) bytes = 0;
  bytes = Math.min(bytes, MAX_BYTES);

  const block = randomBlock();
  let remaining = bytes;

  const stream = new ReadableStream({
    pull(controller) {
      if (remaining <= 0) {
        controller.close();
        return;
      }
      const size = Math.min(CHUNK, remaining);
      controller.enqueue(size === CHUNK ? block : block.subarray(0, size));
      remaining -= size;
    },
  });

  return new Response(stream, {
    headers: {
      ...CORS,
      "Content-Type": "application/octet-stream",
      "Content-Length": String(bytes),
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Content-Encoding": "identity",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
