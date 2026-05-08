"use client";
import * as React from "react";
import { Copy, Check, AlertTriangle, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MetaInput {
  title: string; description: string; keywords: string; author: string;
  canonicalUrl: string; robots: string; ogTitle: string; ogDescription: string;
  ogImage: string; ogType: string; ogSiteName: string;
  twitterCard: string; twitterSite: string; twitterCreator: string; twitterTitle: string; twitterDescription: string; twitterImage: string;
  themeColor: string; viewport: string; charset: string;
}

const DEFAULT: MetaInput = {
  title: "", description: "", keywords: "", author: "", canonicalUrl: "", robots: "index, follow",
  ogTitle: "", ogDescription: "", ogImage: "", ogType: "website", ogSiteName: "",
  twitterCard: "summary_large_image", twitterSite: "", twitterCreator: "", twitterTitle: "", twitterDescription: "", twitterImage: "",
  themeColor: "", viewport: "width=device-width, initial-scale=1", charset: "UTF-8",
};

function generateTags(f: MetaInput, onlyFilled: boolean): string {
  const tag = (n: string, v: string, attr = "name") => v ? `  <meta ${attr}="${n}" content="${v.replace(/"/g, "&quot;")}" />` : "";
  const lines: string[] = [];
  lines.push(`  <meta charset="${f.charset}" />`);
  lines.push(`  <meta name="viewport" content="${f.viewport}" />`);
  if (f.title) lines.push(`  <title>${f.title}</title>`);
  if (f.description || !onlyFilled) lines.push(tag("description", f.description));
  if (f.keywords) lines.push(tag("keywords", f.keywords));
  if (f.author) lines.push(tag("author", f.author));
  lines.push(tag("robots", f.robots));
  if (f.canonicalUrl) lines.push(`  <link rel="canonical" href="${f.canonicalUrl}" />`);
  if (f.themeColor) lines.push(tag("theme-color", f.themeColor));
  lines.push("");
  lines.push("  <!-- Open Graph -->");
  lines.push(tag("og:type", f.ogType, "property"));
  if (f.ogTitle || !onlyFilled) lines.push(tag("og:title", f.ogTitle || f.title, "property"));
  if (f.ogDescription || !onlyFilled) lines.push(tag("og:description", f.ogDescription || f.description, "property"));
  if (f.ogImage || !onlyFilled) lines.push(tag("og:image", f.ogImage, "property"));
  if (f.canonicalUrl) lines.push(tag("og:url", f.canonicalUrl, "property"));
  if (f.ogSiteName) lines.push(tag("og:site_name", f.ogSiteName, "property"));
  lines.push("");
  lines.push("  <!-- Twitter Card -->");
  lines.push(tag("twitter:card", f.twitterCard));
  if (f.twitterSite) lines.push(tag("twitter:site", f.twitterSite));
  if (f.twitterCreator) lines.push(tag("twitter:creator", f.twitterCreator));
  if (f.twitterTitle || f.ogTitle || f.title) lines.push(tag("twitter:title", f.twitterTitle || f.ogTitle || f.title));
  if (f.twitterDescription || f.ogDescription || f.description) lines.push(tag("twitter:description", f.twitterDescription || f.ogDescription || f.description));
  if (f.twitterImage || f.ogImage) lines.push(tag("twitter:image", f.twitterImage || f.ogImage));
  return lines.filter(l => !onlyFilled || l === "" || !l.includes('content=""')).join("\n");
}

function getWarnings(f: MetaInput) {
  const w: { field: string; msg: string }[] = [];
  if (f.title.length > 60) w.push({ field: "title", msg: `Title is ${f.title.length}/60 chars — Google may truncate` });
  if (f.description.length > 160) w.push({ field: "description", msg: `Description is ${f.description.length}/160 chars — may be truncated` });
  if (!f.ogImage) w.push({ field: "ogImage", msg: "No OG image — social shares show no preview" });
  if (!f.canonicalUrl) w.push({ field: "canonical", msg: "No canonical URL — may cause duplicate content issues" });
  return w;
}

type Tab = "basic" | "og" | "twitter" | "technical";
const TABS: { id: Tab; label: string }[] = [
  { id: "basic", label: "Basic SEO" }, { id: "og", label: "Open Graph" },
  { id: "twitter", label: "Twitter" }, { id: "technical", label: "Technical" },
];

function InputField({ label, id, value, onChange, placeholder, maxLen, hint }: {
  label: string; id: string; value: string; onChange: (v: string) => void; placeholder?: string; maxLen?: number; hint?: string;
}) {
  const over = maxLen && value.length > maxLen;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label>
        {maxLen && <span className={`text-[10px] tabular-nums ${over ? "text-destructive" : "text-muted-foreground/50"}`}>{value.length}/{maxLen}</span>}
      </div>
      <input id={id} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      {hint && <p className="text-[11px] text-muted-foreground/60">{hint}</p>}
    </div>
  );
}

export function MetaTagGeneratorTool() {
  const [f, setF] = React.useState<MetaInput>(DEFAULT);
  const [tab, setTab] = React.useState<Tab>("basic");
  const [onlyFilled, setOnlyFilled] = React.useState(true);
  const [copied, setCopied] = React.useState(false);
  const up = (k: keyof MetaInput, v: string) => setF(prev => ({ ...prev, [k]: v }));

  const output = generateTags(f, onlyFilled);
  const warnings = getWarnings(f);

  async function copy() { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500); }

  const previewTitle = f.ogTitle || f.title || "Your Page Title";
  const previewDesc = f.ogDescription || f.description || "Your page description will appear here.";
  const previewDomain = f.canonicalUrl ? new URL(f.canonicalUrl.startsWith("http") ? f.canonicalUrl : "https://" + f.canonicalUrl).hostname : "yourdomain.com";

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === t.id ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="rounded-lg border border-border/60 bg-card px-5 py-4 space-y-3">
        {tab === "basic" && <>
          <InputField label="Page Title" id="meta-title" value={f.title} onChange={v => up("title", v)} placeholder="My Awesome Page" maxLen={60} />
          <InputField label="Meta Description" id="meta-desc" value={f.description} onChange={v => up("description", v)} placeholder="A concise description of this page…" maxLen={160} />
          <InputField label="Keywords" id="meta-keywords" value={f.keywords} onChange={v => up("keywords", v)} placeholder="keyword1, keyword2, keyword3" hint="Optional — Google ignores keywords meta but Bing uses it" />
          <InputField label="Author" id="meta-author" value={f.author} onChange={v => up("author", v)} placeholder="John Doe" />
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Robots</label>
            <select value={f.robots} onChange={e => up("robots", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="index, follow">index, follow (default)</option>
              <option value="noindex, follow">noindex, follow</option>
              <option value="index, nofollow">index, nofollow</option>
              <option value="noindex, nofollow">noindex, nofollow</option>
              <option value="noarchive">noarchive</option>
            </select>
          </div>
          <InputField label="Canonical URL" id="meta-canonical" value={f.canonicalUrl} onChange={v => up("canonicalUrl", v)} placeholder="https://yourdomain.com/page" />
        </>}

        {tab === "og" && <>
          <InputField label="OG Title" id="og-title" value={f.ogTitle} onChange={v => up("ogTitle", v)} placeholder={f.title || "Defaults to page title"} maxLen={70} />
          <InputField label="OG Description" id="og-desc" value={f.ogDescription} onChange={v => up("ogDescription", v)} placeholder={f.description || "Defaults to meta description"} maxLen={200} />
          <InputField label="OG Image URL" id="og-image" value={f.ogImage} onChange={v => up("ogImage", v)} placeholder="https://yourdomain.com/og-image.jpg" hint="Recommended size: 1200×630px (2:1 ratio)" />
          <InputField label="Site Name" id="og-sitename" value={f.ogSiteName} onChange={v => up("ogSiteName", v)} placeholder="My Website" />
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">OG Type</label>
            <select value={f.ogType} onChange={e => up("ogType", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
              {["website", "article", "product", "video.other", "music.song"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </>}

        {tab === "twitter" && <>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Card type</label>
            <div className="flex gap-2 flex-wrap">
              {["summary", "summary_large_image", "app", "player"].map(c => (
                <button key={c} onClick={() => up("twitterCard", c)}
                  className={`px-3 py-1.5 rounded-md text-xs transition-colors ${f.twitterCard === c ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <InputField label="Twitter Site Handle" id="tw-site" value={f.twitterSite} onChange={v => up("twitterSite", v)} placeholder="@yourbrand" />
          <InputField label="Twitter Creator Handle" id="tw-creator" value={f.twitterCreator} onChange={v => up("twitterCreator", v)} placeholder="@yourname" />
          <InputField label="Twitter Title" id="tw-title" value={f.twitterTitle} onChange={v => up("twitterTitle", v)} placeholder={f.ogTitle || f.title || "Defaults to OG/page title"} maxLen={70} />
          <InputField label="Twitter Description" id="tw-desc" value={f.twitterDescription} onChange={v => up("twitterDescription", v)} placeholder={f.ogDescription || f.description || "Defaults to OG/meta description"} maxLen={200} />
          <InputField label="Twitter Image URL" id="tw-image" value={f.twitterImage} onChange={v => up("twitterImage", v)} placeholder={f.ogImage || "Defaults to OG image"} hint="Min 144×144px for summary, 1200×628px recommended for summary_large_image" />
        </>}

        {tab === "technical" && <>
          <InputField label="Theme Color" id="tech-themecolor" value={f.themeColor} onChange={v => up("themeColor", v)} placeholder="#ffffff" hint="Browser tab and mobile UI color" />
          <InputField label="Viewport" id="tech-viewport" value={f.viewport} onChange={v => up("viewport", v)} placeholder="width=device-width, initial-scale=1" />
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Charset</label>
            <select value={f.charset} onChange={e => up("charset", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="UTF-8">UTF-8 (recommended)</option>
              <option value="ISO-8859-1">ISO-8859-1</option>
            </select>
          </div>
        </>}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-1.5">
          {warnings.map(w => (
            <div key={w.field} className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-500/80">{w.msg}</p>
            </div>
          ))}
        </div>
      )}

      {/* Social preview */}
      {(f.title || f.ogTitle) && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Social preview (approximate)</p>
          <div className="rounded-lg border border-border/60 overflow-hidden bg-[#f0f2f5]">
            {f.ogImage && <div className="h-40 bg-secondary/30"><img src={f.ogImage} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = "none")} /></div>}
            <div className="px-3 py-2.5 bg-white border-t border-border/20">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">{previewDomain}</p>
              <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">{previewTitle}</p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{previewDesc}</p>
            </div>
          </div>
        </div>
      )}

      {/* Output */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={onlyFilled} onChange={e => setOnlyFilled(e.target.checked)} className="rounded" />
            Only include filled fields
          </label>
          <Button size="sm" variant="outline" onClick={copy} className="gap-1.5">
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <textarea readOnly value={output}
          className="w-full h-48 rounded-md border border-input bg-background px-3 py-2.5 font-mono text-xs leading-relaxed resize-y focus:outline-none"
          spellCheck={false} />
      </div>
    </div>
  );
}
