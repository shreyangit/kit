"use client";
import * as React from "react";
import {
  Copy, Check, Search, Wifi, MapPin, Globe, Building2, Clock, Coins, Phone,
  Network, Ruler, ExternalLink, History, Info, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface IPData {
  ip: string;
  type?: string;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  flag?: string;
  postal?: string;
  continent?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  utcOffset?: string;
  localTime?: string;
  callingCode?: string;
  isp?: string;
  org?: string;
  asn?: string;
  domain?: string;
  currency?: string;
  isEU?: boolean;
  provider?: string;
}

// ── validation ────────────────────────────────────────────────────────────
function isValidIP(ip: string): boolean {
  const v4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
  if (v4.test(ip)) return true;
  // permissive IPv6 (full, compressed, or mixed) — final correctness left to API
  const v6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:)+:([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}|::([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:)$/;
  return v6.test(ip);
}

function flagEmoji(cc?: string): string {
  if (!cc || cc.length !== 2) return "";
  try {
    return String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
  } catch {
    return "";
  }
}

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// ── map (self-hosted Leaflet + OSM tiles) ──────────────────────────────────
// We render the map ourselves rather than embedding openstreetmap.org's
// export/embed.html in an <iframe>: framed third-party pages are frequently
// blocked by privacy/ad-blockers (showing a "blocked content" placeholder),
// whereas plain tile images load reliably.
declare global { interface Window { L?: unknown } }

function LeafletMap({ lat, lng, label }: { lat: number; lng: number; label?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inst = React.useRef<any>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (!document.getElementById("leaflet-css")) {
          const link = document.createElement("link");
          link.id = "leaflet-css";
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!(window as any).L) {
          await new Promise<void>((res, rej) => {
            const s = document.createElement("script");
            s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
            s.onload = () => res();
            s.onerror = () => rej(new Error("leaflet failed to load"));
            document.head.appendChild(s);
          });
        }
        if (cancelled || !ref.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const L = (window as any).L;
        const map = L.map(ref.current, { zoomControl: true, scrollWheelZoom: false, attributionControl: true }).setView([lat, lng], 11);
        inst.current = map;
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(map);
        const icon = L.divIcon({
          className: "",
          html: '<div style="width:16px;height:16px;border-radius:50% 50% 50% 0;background:#ef4444;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 14],
        });
        L.marker([lat, lng], { icon }).addTo(map).bindPopup(label || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }
    load();
    return () => {
      cancelled = true;
      if (inst.current) {
        try { inst.current.remove(); } catch { /* */ }
        inst.current = null;
      }
    };
  }, [lat, lng, label]);

  if (failed) {
    return (
      <div className="w-full h-56 flex items-center justify-center bg-secondary/30 text-xs text-muted-foreground px-4 text-center">
        Map couldn&apos;t load (a content blocker may be active). Coordinates and the Google Maps link still work.
      </div>
    );
  }
  return <div ref={ref} className="w-full h-56 bg-secondary/20" />;
}

// ── providers ───────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeIpwho(d: any): IPData {
  return {
    ip: d.ip,
    type: d.type,
    city: d.city,
    region: d.region,
    country: d.country,
    countryCode: d.country_code,
    flag: d.flag?.emoji || flagEmoji(d.country_code),
    postal: d.postal,
    continent: d.continent,
    latitude: d.latitude,
    longitude: d.longitude,
    timezone: d.timezone?.id,
    utcOffset: d.timezone?.utc,
    localTime: d.timezone?.current_time,
    callingCode: d.calling_code ? `+${String(d.calling_code).replace(/^\+/, "")}` : undefined,
    isp: d.connection?.isp,
    org: d.connection?.org,
    asn: d.connection?.asn ? `AS${String(d.connection.asn).replace(/^AS/i, "")}` : undefined,
    domain: d.connection?.domain,
    currency: d.currency ? `${d.currency.name} (${d.currency.code})` : undefined,
    isEU: d.is_eu,
    provider: "ipwho.is",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeIpapi(d: any): IPData {
  return {
    ip: d.ip,
    type: d.version,
    city: d.city,
    region: d.region,
    country: d.country_name,
    countryCode: d.country_code,
    flag: flagEmoji(d.country_code),
    postal: d.postal,
    continent: d.continent_code,
    latitude: d.latitude,
    longitude: d.longitude,
    timezone: d.timezone,
    utcOffset: d.utc_offset,
    callingCode: d.country_calling_code,
    isp: d.org,
    org: d.org,
    asn: d.asn,
    currency: d.currency_name ? `${d.currency_name} (${d.currency})` : undefined,
    isEU: d.in_eu,
    provider: "ipapi.co",
  };
}

async function fetchIP(ip?: string): Promise<IPData> {
  // Primary: ipwho.is (https, CORS, no key, rich data)
  try {
    const url = ip ? `https://ipwho.is/${encodeURIComponent(ip)}` : "https://ipwho.is/";
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    const d = await r.json();
    if (d && d.success !== false && d.ip) return normalizeIpwho(d);
    if (d && d.success === false && d.message && /reserved|invalid/i.test(d.message)) {
      throw new Error(d.message);
    }
    throw new Error(d?.message || "ipwho.is lookup failed");
  } catch (primaryErr) {
    // Fallback: ipapi.co
    try {
      const url = ip ? `https://ipapi.co/${encodeURIComponent(ip)}/json/` : "https://ipapi.co/json/";
      const r = await fetch(url, { headers: { Accept: "application/json" } });
      if (r.status === 429) throw new Error("Both providers are rate-limited. Please wait a moment and retry.");
      const d = await r.json();
      if (d.error) throw new Error(d.reason || "Invalid IP or lookup failed");
      return normalizeIpapi(d);
    } catch (fallbackErr) {
      throw new Error((fallbackErr as Error).message || (primaryErr as Error).message || "Lookup failed");
    }
  }
}

// ── small UI bits ─────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch { /* */ } }}
      className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
      aria-label="Copy"
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

const HISTORY_KEY = "kit-ip-history-v1";
interface HistItem { ip: string; label: string }

export function IpLookupTool() {
  const [mode, setMode] = React.useState<"my" | "other">("my");
  const [inputIP, setInputIP] = React.useState("");
  const [result, setResult] = React.useState<IPData | null>(null);
  const [myData, setMyData] = React.useState<IPData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedJson, setCopiedJson] = React.useState(false);
  const [history, setHistory] = React.useState<HistItem[]>([]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch { /* */ }
    lookup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pushHistory(d: IPData) {
    const label = [d.city, d.country].filter(Boolean).join(", ") || d.ip;
    setHistory((prev) => {
      const next = [{ ip: d.ip, label }, ...prev.filter((h) => h.ip !== d.ip)].slice(0, 6);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* */ }
      return next;
    });
  }

  async function lookup(ip?: string) {
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await fetchIP(ip);
      setResult(data);
      if (!ip) setMyData(data);
      else pushHistory(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleLookup() {
    if (mode === "my") { lookup(); return; }
    const ip = inputIP.trim();
    if (!ip) return;
    if (!isValidIP(ip)) { setError("Enter a valid IPv4 or IPv6 address."); return; }
    lookup(ip);
  }

  async function copyJson() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 1500);
    } catch { /* */ }
  }

  const hasCoords = result?.latitude != null && result?.longitude != null;

  const distance = result && myData && result.ip !== myData.ip
    && result.latitude != null && result.longitude != null
    && myData.latitude != null && myData.longitude != null
    ? haversineKm({ lat: myData.latitude, lon: myData.longitude }, { lat: result.latitude, lon: result.longitude })
    : null;

  const details: { icon: React.ElementType; label: string; value?: string; hint?: string }[] = result ? [
    { icon: MapPin, label: "City", value: result.city },
    { icon: Globe, label: "Region", value: result.region },
    { icon: Globe, label: "Country", value: result.country ? `${result.flag ? result.flag + " " : ""}${result.country}${result.isEU ? " · EU" : ""}` : undefined },
    { icon: MapPin, label: "Postal", value: result.postal },
    { icon: Clock, label: "Timezone", value: result.timezone, hint: "IANA timezone for the IP's location." },
    { icon: Clock, label: "Local time", value: result.localTime ? new Date(result.localTime).toLocaleTimeString() : undefined, hint: "Current wall-clock time at the IP's location." },
    { icon: MapPin, label: "Coordinates", value: result.latitude != null && result.longitude != null ? `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}` : undefined },
    { icon: Building2, label: "ISP", value: result.isp, hint: "Internet Service Provider operating this address." },
    { icon: Network, label: "Organization", value: result.org && result.org !== result.isp ? result.org : undefined },
    { icon: Network, label: "ASN", value: result.asn, hint: "Autonomous System Number — the network block this IP belongs to." },
    { icon: Globe, label: "Domain", value: result.domain },
    { icon: Phone, label: "Calling code", value: result.callingCode },
    { icon: Coins, label: "Currency", value: result.currency },
    { icon: Ruler, label: "UTC offset", value: result.utcOffset },
  ].filter((x) => x.value) : [];

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Mode + Input */}
      <div className="space-y-3">
        <div className="flex gap-1.5">
          <button onClick={() => { setMode("my"); setInputIP(""); setError(null); if (myData) setResult(myData); }}
            className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors", mode === "my" ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground")}>
            My IP
          </button>
          <button onClick={() => { setMode("other"); setError(null); }}
            className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors", mode === "other" ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground")}>
            Look up another IP
          </button>
        </div>

        {mode === "other" ? (
          <div className="flex gap-2">
            <input id="ip-input" value={inputIP} onChange={(e) => setInputIP(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. 8.8.8.8 or 2001:4860:4860::8888" />
            <Button onClick={handleLookup} disabled={loading} id="ip-lookup-btn" className="gap-1.5 shrink-0">
              <Search className="h-4 w-4" />{loading ? "Looking up…" : "Look Up"}
            </Button>
          </div>
        ) : (
          <Button onClick={() => lookup()} disabled={loading} variant="outline" size="sm" className="gap-1.5" id="ip-refresh">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />{loading ? "Detecting…" : "Refresh"}
          </Button>
        )}

        {/* recent lookups */}
        {mode === "other" && history.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <History className="h-3.5 w-3.5 text-muted-foreground" />
            {history.map((h) => (
              <button key={h.ip} onClick={() => { setInputIP(h.ip); lookup(h.ip); }}
                className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title={h.label}>
                {h.ip}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* loading skeleton */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-[68px] rounded-lg bg-secondary/40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-[52px] rounded-md bg-secondary/30" />)}
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          {/* IP badge */}
          <div className="rounded-lg border border-border/60 bg-card px-5 py-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary shrink-0 text-xl">
              {result.flag || <Wifi className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">IP Address {mode === "my" && "· yours"}</p>
              <p className="text-xl font-mono font-semibold truncate">{result.ip}</p>
              <p className="text-xs text-muted-foreground">
                {result.type || "IP"}{result.isp ? ` · ${result.isp}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <CopyBtn text={result.ip} />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={copyJson} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" aria-label="Copy JSON">
                    {copiedJson ? <Check className="h-3.5 w-3.5 text-green-500" /> : <span className="text-[10px] font-mono px-1">JSON</span>}
                  </button>
                </TooltipTrigger>
                <TooltipContent>Copy all data as JSON</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* distance from you */}
          {distance != null && (
            <div className="flex items-center gap-2 rounded-md border border-border/60 bg-card px-3 py-2 text-sm">
              <Ruler className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Approx. distance from your location:</span>
              <span className="font-medium">{Math.round(distance).toLocaleString()} km</span>
              <span className="text-muted-foreground">({Math.round(distance * 0.621).toLocaleString()} mi)</span>
            </div>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {details.map(({ icon: Icon, label, value, hint }) => (
              <div key={label} className="flex items-center gap-2.5 rounded-md border border-border/60 bg-card px-3 py-2.5">
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    {label}
                    {hint && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button aria-label={`About ${label}`} className="text-muted-foreground/60 hover:text-foreground"><Info className="h-2.5 w-2.5" /></button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[220px] text-center">{hint}</TooltipContent>
                      </Tooltip>
                    )}
                  </p>
                  <p className="text-sm truncate" title={value}>{value}</p>
                </div>
                <CopyBtn text={value!} />
              </div>
            ))}
          </div>

          {/* Map */}
          {hasCoords && (
            <div className="rounded-lg overflow-hidden border border-border/60">
              <LeafletMap
                key={`${result.latitude},${result.longitude}`}
                lat={result.latitude!}
                lng={result.longitude!}
                label={[result.city, result.country].filter(Boolean).join(", ") || result.ip}
              />
              <div className="flex items-center justify-between px-3 py-1.5 border-t border-border/40">
                <p className="text-[10px] text-muted-foreground">IP geolocation is approximate (city-level at best).</p>
                <a href={`https://www.google.com/maps?q=${result.latitude},${result.longitude}`} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> Google Maps
                </a>
              </div>
            </div>
          )}

          {result.provider && (
            <p className="text-[10px] text-muted-foreground/70 text-right">Data: {result.provider}</p>
          )}
        </div>
      )}
    </div>
  );
}
