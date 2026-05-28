// Cloudflare Pages Function: /api/speedtest/meta
// Returns connection metadata derived from Cloudflare's edge: the client's IP,
// approximate geo, ISP/ASN, the data center (colo) serving the test, and the
// negotiated HTTP protocol. Everything comes from `request.cf`, no third party.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

export async function onRequest(context) {
  const { request } = context;
  const cf = request.cf ?? {};

  const ip =
    request.headers.get("CF-Connecting-IP") ??
    request.headers.get("X-Forwarded-For") ??
    "";

  const body = {
    ip,
    city: cf.city ?? null,
    region: cf.region ?? null,
    country: cf.country ?? null,
    isp: cf.asOrganization ?? null,
    asn: cf.asn ?? null,
    colo: cf.colo ?? null, // 3-letter Cloudflare data-center code (e.g. SJC)
    httpProtocol: cf.httpProtocol ?? null,
    latitude: cf.latitude ?? null,
    longitude: cf.longitude ?? null,
  };

  return new Response(JSON.stringify(body), { headers: CORS });
}
