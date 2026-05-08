"use client";
import * as React from "react";
import { Search, Globe, AlertTriangle, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OGData {
  title?: string; description?: string; image?: string; siteName?: string;
  type?: string; url?: string; twitterCard?: string; twitterTitle?: string;
  twitterDescription?: string; twitterImage?: string; favicon?: string;
  themeColor?: string; finalUrl: string;
}

// Use allorigins.win as a CORS proxy to fetch public pages
async function fetchOG(targetUrl: string): Promise<OGData> {
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
  const resp = await fetch(proxyUrl);
  if (!resp.ok) throw new Error(`Could not fetch URL (HTTP ${resp.status})`);
  const json = await resp.json() as { contents: string; status: { url: string } };
  const html = json.contents;
  const finalUrl = json.status?.url || targetUrl;

  function meta(key: string): string | undefined {
    const patterns = [
      new RegExp(`<meta\\s+property=["']${key}["']\\s+content=["']([^"']+)["']`, "i"),
      new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+property=["']${key}["']`, "i"),
      new RegExp(`<meta\\s+name=["']${key}["']\\s+content=["']([^"']+)["']`, "i"),
    ];
    for (const p of patterns) { const m = html.match(p); if (m) return m[1]; }
  }

  const titleM = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const faviconM = html.match(/<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i);
  const base = new URL(finalUrl);
  const favicon = faviconM
    ? (faviconM[1].startsWith("http") ? faviconM[1] : new URL(faviconM[1], base).href)
    : `${base.origin}/favicon.ico`;

  return {
    title: meta("og:title") || titleM?.[1] || undefined,
    description: meta("og:description") || meta("description"),
    image: meta("og:image"),
    siteName: meta("og:site_name"),
    type: meta("og:type"),
    url: meta("og:url") || targetUrl,
    twitterCard: meta("twitter:card"),
    twitterTitle: meta("twitter:title"),
    twitterDescription: meta("twitter:description"),
    twitterImage: meta("twitter:image"),
    themeColor: meta("theme-color"),
    favicon,
    finalUrl,
  };
}

const EXAMPLE_URLS = ["https://github.com", "https://vercel.com", "https://notion.so", "https://stripe.com"];

function CopyBtn({ text }: { text: string }) {
  const [c, setC] = React.useState(false);
  return (
    <button onClick={async () => { await navigator.clipboard.writeText(text); setC(true); setTimeout(() => setC(false), 1200); }}
      className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
      {c ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

export function OgPreviewTool() {
  const [url, setUrl] = React.useState("");
  const [data, setData] = React.useState<OGData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [cache, setCache] = React.useState<Map<string, OGData>>(new Map());

  async function fetch_(inputUrl: string) {
    const normalized = inputUrl.startsWith("http") ? inputUrl : "https://" + inputUrl;
    if (cache.has(normalized)) { setData(cache.get(normalized)!); return; }
    setLoading(true); setError(null); setData(null);
    try {
      const result = await fetchOG(normalized);
      setData(result);
      setCache(prev => new Map(prev).set(normalized, result));
    } catch (e) {
      setError(`${(e as Error).message}. Note: Some sites block scraping or have strict CSP headers.`);
    }
    setLoading(false);
  }

  const previewImg = data?.image || data?.twitterImage;
  const previewTitle = data?.title || data?.twitterTitle || "Untitled";
  const previewDesc = data?.description || data?.twitterDescription || "";
  const domain = data?.finalUrl ? (() => { try { return new URL(data.finalUrl).hostname; } catch { return data.finalUrl; } })() : "";

  const missing: string[] = [];
  if (data && !data.image) missing.push("og:image");
  if (data && !data.title) missing.push("og:title");
  if (data && !data.description) missing.push("og:description");
  if (data && !data.twitterCard) missing.push("twitter:card");

  const allTags = data ? [
    ["og:title", data.title], ["og:description", data.description], ["og:image", data.image],
    ["og:type", data.type], ["og:url", data.url], ["og:site_name", data.siteName],
    ["twitter:card", data.twitterCard], ["twitter:title", data.twitterTitle],
    ["twitter:description", data.twitterDescription], ["twitter:image", data.twitterImage],
    ["theme-color", data.themeColor],
  ].filter(([, v]) => v) : [];

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Input */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Public URL to inspect</label>
        <div className="flex gap-2">
          <input id="og-url-input" value={url} onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetch_(url)}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="https://example.com" />
          <Button onClick={() => fetch_(url)} disabled={loading || !url.trim()} id="og-fetch-btn" className="gap-1.5 shrink-0">
            <Search className="h-4 w-4" />{loading ? "Fetching…" : "Preview"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_URLS.map(u => (
            <button key={u} onClick={() => { setUrl(u); fetch_(u); }}
              className="px-2 py-0.5 rounded border border-border/60 text-xs text-muted-foreground hover:text-foreground transition-colors">
              {new URL(u).hostname}
            </button>
          ))}
        </div>
        <div className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-px shrink-0" />
          <p className="text-[11px] text-amber-500/80">Uses a public CORS proxy. Some sites (e.g. with strict CSP) may not load. For production use, deploy a Cloudflare Worker.</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-3.5 w-3.5 rounded-full border-2 border-border border-t-foreground animate-spin inline-block" />Fetching and parsing meta tags…
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}

      {data && (
        <div className="space-y-5">
          {/* Missing tags */}
          {missing.length > 0 && (
            <div className="space-y-1">
              {missing.map(t => (
                <div key={t} className="flex items-center gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-1.5">
                  <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-500/80">Missing <span className="font-mono">{t}</span></p>
                </div>
              ))}
            </div>
          )}

          {/* Facebook/LinkedIn preview */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Facebook / LinkedIn preview</p>
            <div className="rounded-lg border border-border/60 overflow-hidden max-w-sm">
              {previewImg && (
                <div className="h-40 bg-secondary/20">
                  <img src={previewImg} alt="" className="w-full h-full object-cover" onError={e => ((e.target as HTMLElement).style.display = "none")} />
                </div>
              )}
              <div className="px-3 py-2.5 bg-[#f0f2f5] dark:bg-secondary/30">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">{domain}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-foreground leading-tight line-clamp-2">{previewTitle}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{previewDesc}</p>
              </div>
            </div>
          </div>

          {/* Twitter card preview */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Twitter / X preview</p>
            <div className="rounded-xl border border-border/60 overflow-hidden max-w-sm">
              {previewImg && data.twitterCard === "summary_large_image" && (
                <div className="h-48 bg-secondary/20">
                  <img src={previewImg} alt="" className="w-full h-full object-cover" onError={e => ((e.target as HTMLElement).style.display = "none")} />
                </div>
              )}
              <div className="flex items-center gap-3 px-3 py-2.5 bg-card">
                {data.favicon && <img src={data.favicon} alt="" className="h-5 w-5 rounded-sm" onError={e => ((e.target as HTMLElement).style.display = "none")} />}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{data.twitterTitle || previewTitle}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{domain}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Raw tags */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">All meta tags found</p>
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <div className="divide-y divide-border/40">
                {allTags.map(([prop, val]) => (
                  <div key={prop as string} className="flex items-start gap-2 px-3 py-2">
                    <code className="text-[11px] font-mono text-muted-foreground w-36 shrink-0 mt-0.5">{prop as string}</code>
                    <p className="text-xs flex-1 min-w-0 break-all">{val as string}</p>
                    <CopyBtn text={val as string} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <a href={data.finalUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ExternalLink className="h-3 w-3" />Open {domain}
          </a>
        </div>
      )}
    </div>
  );
}
