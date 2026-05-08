"use client";
import * as React from "react";
import { Copy, Check, Download, Plus, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadText } from "@/lib/utils/download";

const COMMON_BOTS = [
  { label: "All robots", value: "*" },
  { label: "Googlebot", value: "Googlebot" },
  { label: "Google Images", value: "Googlebot-Image" },
  { label: "Bingbot", value: "Bingbot" },
  { label: "DuckDuckBot", value: "DuckDuckBot" },
  { label: "YandexBot", value: "YandexBot" },
  { label: "GPTBot", value: "GPTBot" },
  { label: "CCBot", value: "CCBot" },
  { label: "AhrefsBot", value: "AhrefsBot" },
  { label: "SemrushBot", value: "SemrushBot" },
];

const COMMON_PATHS = ["/admin/", "/api/", "/private/", "/tmp/", "/wp-admin/", "/wp-login.php", "/search?", "/login", "/checkout"];

interface Rule { id: string; userAgent: string; allow: string[]; disallow: string[]; crawlDelay: string; }

function buildRule(): Rule {
  return { id: Math.random().toString(36).slice(2), userAgent: "*", allow: [], disallow: ["/"], crawlDelay: "" };
}

function generateRobots(rules: Rule[], sitemaps: string[]): string {
  const sections: string[] = [];
  for (const rule of rules) {
    const lines: string[] = [`User-agent: ${rule.userAgent}`];
    rule.allow.filter(Boolean).forEach(p => lines.push(`Allow: ${p}`));
    rule.disallow.filter(Boolean).forEach(p => lines.push(`Disallow: ${p}`));
    if (rule.crawlDelay) lines.push(`Crawl-delay: ${rule.crawlDelay}`);
    sections.push(lines.join("\n"));
  }
  sitemaps.filter(Boolean).forEach(s => sections.push(`Sitemap: ${s}`));
  return sections.join("\n\n");
}

function checkWarnings(rules: Rule[]): string[] {
  const ws: string[] = [];
  const wildcard = rules.find(r => r.userAgent === "*");
  if (wildcard?.disallow.includes("/")) ws.push('Disallow: / on User-agent: * — this blocks ALL search engines from indexing your site!');
  return ws;
}

function PathList({ paths, onChange, placeholder }: { paths: string[]; onChange: (paths: string[]) => void; placeholder: string }) {
  return (
    <div className="space-y-1">
      {paths.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input value={p} onChange={e => { const np = [...paths]; np[i] = e.target.value; onChange(np); }}
            className="flex-1 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder={placeholder} />
          <button onClick={() => onChange(paths.filter((_, j) => j !== i))} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button onClick={() => onChange([...paths, ""])} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
        <Plus className="h-3 w-3" />Add path
      </button>
    </div>
  );
}

export function RobotsTxtTool() {
  const [rules, setRules] = React.useState<Rule[]>([buildRule()]);
  const [sitemaps, setSitemaps] = React.useState<string[]>([""]);
  const [copied, setCopied] = React.useState(false);

  function updateRule(id: string, key: keyof Rule, val: unknown) {
    setRules(rs => rs.map(r => r.id === id ? { ...r, [key]: val } : r));
  }
  function removeRule(id: string) { setRules(rs => rs.filter(r => r.id !== id)); }

  const output = generateRobots(rules, sitemaps);
  const warnings = checkWarnings(rules);

  async function copy() { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500); }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Quick presets */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setRules([{ id: "1", userAgent: "*", allow: [], disallow: [], crawlDelay: "" }])}
          className="px-2.5 py-1 rounded-md border border-border/60 text-xs text-muted-foreground hover:text-foreground transition-colors">Allow all</button>
        <button onClick={() => setRules([{ id: "1", userAgent: "*", allow: [], disallow: ["/"], crawlDelay: "" }])}
          className="px-2.5 py-1 rounded-md border border-border/60 text-xs text-muted-foreground hover:text-foreground transition-colors">Block all</button>
        <button onClick={() => setRules([
          { id: "1", userAgent: "*", allow: [], disallow: ["/admin/", "/api/", "/login", "/checkout"], crawlDelay: "" },
          { id: "2", userAgent: "GPTBot", allow: [], disallow: ["/"], crawlDelay: "" },
          { id: "3", userAgent: "CCBot", allow: [], disallow: ["/"], crawlDelay: "" },
        ])} className="px-2.5 py-1 rounded-md border border-border/60 text-xs text-muted-foreground hover:text-foreground transition-colors">Typical setup</button>
        <button onClick={() => setRules([
          { id: "1", userAgent: "*", allow: [], disallow: [], crawlDelay: "" },
          { id: "2", userAgent: "GPTBot", allow: [], disallow: ["/"], crawlDelay: "" },
          { id: "3", userAgent: "CCBot", allow: [], disallow: ["/"], crawlDelay: "" },
          { id: "4", userAgent: "AhrefsBot", allow: [], disallow: ["/"], crawlDelay: "" },
        ])} className="px-2.5 py-1 rounded-md border border-border/60 text-xs text-muted-foreground hover:text-foreground transition-colors">Block AI crawlers</button>
      </div>

      {/* Rules */}
      <div className="space-y-3">
        {rules.map((rule, idx) => (
          <div key={rule.id} className="rounded-lg border border-border/60 bg-card px-4 py-3 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Rule {idx + 1}</span>
              {rules.length > 1 && (
                <button onClick={() => removeRule(rule.id)} className="ml-auto p-1 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">User-agent</label>
              <div className="flex gap-2">
                <input value={rule.userAgent} onChange={e => updateRule(rule.id, "userAgent", e.target.value)}
                  className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring" />
                <select onChange={e => updateRule(rule.id, "userAgent", e.target.value)} value=""
                  className="rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="" disabled>Preset</option>
                  {COMMON_BOTS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Disallow</label>
                <PathList paths={rule.disallow} onChange={p => updateRule(rule.id, "disallow", p)} placeholder="/path/" />
                <div className="flex flex-wrap gap-1 mt-1">
                  {COMMON_PATHS.map(p => (
                    <button key={p} onClick={() => { if (!rule.disallow.includes(p)) updateRule(rule.id, "disallow", [...rule.disallow.filter(Boolean), p]); }}
                      className="px-1.5 py-0.5 rounded bg-secondary text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Allow (overrides Disallow)</label>
                <PathList paths={rule.allow} onChange={p => updateRule(rule.id, "allow", p)} placeholder="/public/" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Crawl-delay (seconds, optional)</label>
              <input type="number" value={rule.crawlDelay} onChange={e => updateRule(rule.id, "crawlDelay", e.target.value)}
                className="w-24 rounded-md border border-input bg-background px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring" placeholder="e.g. 10" min={0} />
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setRules(r => [...r, buildRule()])} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />Add rule
        </Button>
      </div>

      {/* Sitemaps */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Sitemap URLs</label>
        {sitemaps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <input value={s} onChange={e => { const n = [...sitemaps]; n[i] = e.target.value; setSitemaps(n); }}
              className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="https://yourdomain.com/sitemap.xml" />
            <button onClick={() => setSitemaps(s => s.filter((_, j) => j !== i))} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button onClick={() => setSitemaps(s => [...s, ""])} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          <Plus className="h-3 w-3" />Add sitemap
        </button>
      </div>

      {/* Warnings */}
      {warnings.map(w => (
        <div key={w} className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-500/80">{w}</p>
        </div>
      ))}

      {/* Output */}
      <div className="space-y-2">
        <textarea readOnly value={output}
          className="w-full h-40 rounded-md border border-input bg-background px-3 py-2.5 font-mono text-xs leading-relaxed resize-y focus:outline-none"
          spellCheck={false} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copy} className="gap-1.5">
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}Copy
          </Button>
          <Button size="sm" onClick={() => downloadText(output, "robots.txt")} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />Download robots.txt
          </Button>
        </div>
      </div>
    </div>
  );
}
