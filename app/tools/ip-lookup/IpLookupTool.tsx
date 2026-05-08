"use client";
import * as React from "react";
import { Copy, Check, Search, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IPData {
  ip: string; version?: string; city?: string; region?: string; country?: string;
  countryCode?: string; latitude?: number; longitude?: number; timezone?: string;
  utcOffset?: string; isp?: string; asn?: string; isEU?: boolean;
}

function isValidIP(ip: string): boolean {
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6 = /^([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}$/;
  return ipv4.test(ip) || ipv6.test(ip);
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
      className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0">
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

export function IpLookupTool() {
  const [mode, setMode] = React.useState<"my" | "other">("my");
  const [inputIP, setInputIP] = React.useState("");
  const [result, setResult] = React.useState<IPData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Auto-lookup own IP on mount
  React.useEffect(() => { lookup(); }, []);

  async function lookup(ip?: string) {
    setLoading(true); setError(null); setResult(null);
    try {
      // Direct fetch to ipapi.co — works client-side for simple lookups
      const target = ip || "json";
      const url = ip ? `https://ipapi.co/${encodeURIComponent(ip)}/json/` : "https://ipapi.co/json/";
      const resp = await fetch(url, { headers: { "Accept": "application/json" } });
      if (resp.status === 429) throw new Error("Rate limited by ipapi.co. Please wait a moment and try again.");
      const data = await resp.json();
      if (data.error) throw new Error(data.reason || "Invalid IP or lookup failed");
      setResult({
        ip: data.ip, version: data.version, city: data.city, region: data.region,
        country: data.country_name, countryCode: data.country_code,
        latitude: data.latitude, longitude: data.longitude,
        timezone: data.timezone, utcOffset: data.utc_offset,
        isp: data.org, asn: data.asn, isEU: data.in_eu,
      });
    } catch (e) { setError((e as Error).message); }
    setLoading(false);
  }

  function handleLookup() {
    if (mode === "my") { lookup(); return; }
    if (!inputIP.trim()) return;
    if (!isValidIP(inputIP.trim())) { setError("Enter a valid IPv4 or IPv6 address"); return; }
    lookup(inputIP.trim());
  }

  const mapUrl = result?.latitude && result?.longitude
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${result.longitude - 0.5},${result.latitude - 0.5},${result.longitude + 0.5},${result.latitude + 0.5}&layer=mapnik&marker=${result.latitude},${result.longitude}`
    : null;

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Mode + Input */}
      <div className="space-y-3">
        <div className="flex gap-1.5">
          <button onClick={() => { setMode("my"); setInputIP(""); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === "my" ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            My IP
          </button>
          <button onClick={() => setMode("other")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === "other" ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            Look up another IP
          </button>
        </div>

        {mode === "other" && (
          <div className="flex gap-2">
            <input id="ip-input" value={inputIP} onChange={e => setInputIP(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLookup()}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. 8.8.8.8 or 2001:4860:4860::8888" />
            <Button onClick={handleLookup} disabled={loading} id="ip-lookup-btn" className="gap-1.5 shrink-0">
              <Search className="h-4 w-4" />{loading ? "Looking up…" : "Look Up"}
            </Button>
          </div>
        )}

        {mode === "my" && (
          <Button onClick={handleLookup} disabled={loading} variant="outline" size="sm" className="gap-1.5" id="ip-refresh">
            <Wifi className="h-3.5 w-3.5" />{loading ? "Detecting…" : "Refresh"}
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-3.5 w-3.5 rounded-full border-2 border-border border-t-foreground animate-spin inline-block" />
          Fetching geolocation…
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {result && (
        <div className="space-y-4">
          {/* IP badge */}
          <div className="rounded-lg border border-border/60 bg-card px-5 py-4 flex items-center gap-3">
            <Wifi className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">IP Address</p>
              <p className="text-xl font-mono font-semibold truncate">{result.ip}</p>
              {result.version && <p className="text-xs text-muted-foreground">{result.version}</p>}
            </div>
            <CopyBtn text={result.ip} />
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "City", value: result.city },
              { label: "Region", value: result.region },
              { label: "Country", value: result.country ? `${result.country}${result.isEU ? " 🇪🇺" : ""}` : undefined },
              { label: "Timezone", value: result.timezone },
              { label: "UTC Offset", value: result.utcOffset },
              { label: "Coordinates", value: result.latitude && result.longitude ? `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}` : undefined },
              { label: "ISP / Org", value: result.isp },
              { label: "ASN", value: result.asn },
            ].filter(x => x.value).map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2 rounded-md border border-border/60 bg-card px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="text-sm truncate">{value}</p>
                </div>
                <CopyBtn text={value!} />
              </div>
            ))}
          </div>

          {/* Map */}
          {mapUrl && (
            <div className="rounded-lg overflow-hidden border border-border/60">
              <iframe src={mapUrl} className="w-full h-48" style={{ border: "none" }} title="IP location map" />
              <p className="text-[10px] text-muted-foreground px-3 py-1.5 border-t border-border/40">
                ⚠ IP geolocation is approximate. City-level accuracy is typical.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
