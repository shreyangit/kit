"use client";
import * as React from "react";
import { Copy, Check, Download, Plus, Trash2, Upload, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { downloadText } from "@/lib/utils/download";

type ChangeFreq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

interface SitemapEntry { id: string; loc: string; lastmod: string; changefreq: ChangeFreq; priority: number; error?: string; }

function escapeXML(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function generateXML(entries: SitemapEntry[]): string {
  const valid = entries.filter(e => !e.error);
  const urlBlocks = valid.map(e => [
    "  <url>",
    `    <loc>${escapeXML(e.loc)}</loc>`,
    e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : "",
    `    <changefreq>${e.changefreq}</changefreq>`,
    `    <priority>${e.priority.toFixed(1)}</priority>`,
    "  </url>",
  ].filter(Boolean).join("\n")).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlBlocks}\n</urlset>`;
}

function validateURL(url: string): string | undefined {
  try { new URL(url); return undefined; }
  catch { return "Invalid URL"; }
}

function parseLines(raw: string, domain: string, defaults: { lastmod: string; changefreq: ChangeFreq; priority: number }): SitemapEntry[] {
  return raw.split("\n").map(line => line.trim()).filter(Boolean).map((line, i) => {
    let loc = line;
    if (!loc.startsWith("http")) loc = (domain.endsWith("/") ? domain.slice(0, -1) : domain) + "/" + loc.replace(/^\//, "");
    const error = validateURL(loc);
    return { id: `${Date.now()}-${i}`, loc, lastmod: defaults.lastmod, changefreq: defaults.changefreq, priority: defaults.priority, error };
  });
}

export function SitemapGeneratorTool() {
  const [rawUrls, setRawUrls] = React.useState("");
  const [domain, setDomain] = React.useState("");
  const [defaultLastmod, setDefaultLastmod] = React.useState(() => new Date().toISOString().split("T")[0]);
  const [defaultFreq, setDefaultFreq] = React.useState<ChangeFreq>("weekly");
  const [defaultPriority, setDefaultPriority] = React.useState(0.5);
  const [entries, setEntries] = React.useState<SitemapEntry[]>([]);
  const [parsed, setParsed] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  function parse() {
    const result = parseLines(rawUrls, domain, { lastmod: defaultLastmod, changefreq: defaultFreq, priority: defaultPriority });
    setEntries(result);
    setParsed(true);
  }

  function updateEntry(id: string, key: keyof SitemapEntry, val: unknown) {
    setEntries(e => e.map(x => x.id === id ? { ...x, [key]: val, error: key === "loc" ? validateURL(String(val)) : x.error } : x));
  }
  function removeEntry(id: string) { setEntries(e => e.filter(x => x.id !== id)); }
  function addEntry() {
    setEntries(e => [...e, { id: Date.now().toString(), loc: "", lastmod: defaultLastmod, changefreq: defaultFreq, priority: defaultPriority }]);
  }

  async function handleCSV(file: File) {
    const text = await file.text();
    const lines = text.split("\n").slice(1);
    const urls = lines.map(l => l.split(",")[0].trim().replace(/^"|"$/g, "")).filter(Boolean);
    setRawUrls(urls.join("\n"));
  }

  const xml = entries.length > 0 ? generateXML(entries) : "";
  const validCount = entries.filter(e => !e.error).length;
  const errorCount = entries.filter(e => e.error).length;

  async function copy() { await navigator.clipboard.writeText(xml); setCopied(true); setTimeout(() => setCopied(false), 1500); }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Input */}
      <div className="space-y-3 rounded-lg border border-border/60 bg-card px-5 py-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Domain (optional — prepend to relative URLs)</label>
          <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="https://yourdomain.com"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">URLs (one per line)</label>
            <button onClick={() => fileRef.current?.click()} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              <Upload className="h-3 w-3" />Import CSV
            </button>
          </div>
          <textarea value={rawUrls} onChange={e => setRawUrls(e.target.value)} rows={6}
            placeholder="https://yourdomain.com/page1&#10;https://yourdomain.com/page2&#10;/relative/path"
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            spellCheck={false} />
        </div>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) handleCSV(f); }} />

        {/* Defaults */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Default lastmod</label>
            <input type="date" value={defaultLastmod} onChange={e => setDefaultLastmod(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Changefreq</label>
            <select value={defaultFreq} onChange={e => setDefaultFreq(e.target.value as ChangeFreq)}
              className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
              {["always","hourly","daily","weekly","monthly","yearly","never"].map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground"><span>Priority</span><span>{defaultPriority.toFixed(1)}</span></div>
            <Slider min={0} max={1} step={0.1} value={[defaultPriority]} onValueChange={([v]) => setDefaultPriority(v)} />
          </div>
        </div>
        <Button onClick={parse} id="sitemap-parse">Parse URLs</Button>
      </div>

      {/* Parsed entries */}
      {parsed && entries.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{validCount} valid</span>
            {errorCount > 0 && <span className="text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{errorCount} errors</span>}
            {validCount > 50000 && <span className="text-amber-500">Exceeds 50,000 URL limit — split into multiple sitemaps</span>}
          </div>
          <div className="max-h-72 overflow-y-auto rounded-lg border border-border/60 divide-y divide-border/40">
            {entries.slice(0, 200).map(e => (
              <div key={e.id} className={`flex items-center gap-2 px-3 py-2 text-xs ${e.error ? "bg-destructive/5" : ""}`}>
                <input value={e.loc} onChange={ev => updateEntry(e.id, "loc", ev.target.value)}
                  className={`flex-1 min-w-0 font-mono text-xs bg-transparent border-none outline-none ${e.error ? "text-destructive" : "text-muted-foreground"}`} />
                <select value={e.changefreq} onChange={ev => updateEntry(e.id, "changefreq", ev.target.value)}
                  className="text-xs bg-transparent border-none outline-none text-muted-foreground shrink-0">
                  {["daily","weekly","monthly"].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <span className="shrink-0 text-muted-foreground/50">{e.priority.toFixed(1)}</span>
                <button onClick={() => removeEntry(e.id)} className="p-0.5 hover:text-destructive transition-colors shrink-0"><X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={addEntry} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />Add URL
          </Button>
        </div>
      )}

      {/* Output */}
      {xml && (
        <div className="space-y-2">
          <textarea readOnly value={xml}
            className="w-full h-48 rounded-md border border-input bg-background px-3 py-2.5 font-mono text-xs leading-relaxed resize-y focus:outline-none"
            spellCheck={false} />
          <div className="flex gap-2">
            <Button onClick={copy} size="sm" variant="outline" className="gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}Copy
            </Button>
            <Button size="sm" onClick={() => downloadText(xml, "sitemap.xml", "application/xml")} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />Download sitemap.xml
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
