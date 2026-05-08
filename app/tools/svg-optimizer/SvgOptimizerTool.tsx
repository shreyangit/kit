"use client";

import * as React from "react";
import { Copy, Check, Download, Upload, RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { downloadBlob } from "@/lib/utils/download";
import { cn } from "@/lib/utils";

interface OptOptions {
  removeComments: boolean;
  removeMetadata: boolean;
  removeTitle: boolean;
  removeDesc: boolean;
  removeHiddenElems: boolean;
  collapseGroups: boolean;
  convertColors: boolean;
  convertPathData: boolean;
  mergePaths: boolean;
  removeUselessDefs: boolean;
  cleanupIds: boolean;
  minifyStyles: boolean;
  removeEmptyAttrs: boolean;
  removeEmptyContainers: boolean;
  precision: number;
}

const DEFAULT_OPTS: OptOptions = {
  removeComments: true, removeMetadata: true, removeTitle: true, removeDesc: true,
  removeHiddenElems: true, collapseGroups: true, convertColors: true, convertPathData: true,
  mergePaths: true, removeUselessDefs: true, cleanupIds: false, minifyStyles: true,
  removeEmptyAttrs: true, removeEmptyContainers: true, precision: 3,
};

const OPTION_META: { key: keyof OptOptions; label: string; danger?: string }[] = [
  { key: "removeComments", label: "Remove comments" },
  { key: "removeMetadata", label: "Remove metadata" },
  { key: "removeTitle", label: "Remove <title>" },
  { key: "removeDesc", label: "Remove <desc>" },
  { key: "removeHiddenElems", label: "Remove hidden elements" },
  { key: "collapseGroups", label: "Collapse groups" },
  { key: "convertColors", label: "Convert colors (rgb → hex)" },
  { key: "convertPathData", label: "Simplify path data" },
  { key: "mergePaths", label: "Merge paths" },
  { key: "removeUselessDefs", label: "Remove useless defs" },
  { key: "minifyStyles", label: "Minify <style>" },
  { key: "removeEmptyAttrs", label: "Remove empty attributes" },
  { key: "removeEmptyContainers", label: "Remove empty containers" },
  { key: "cleanupIds", label: "Clean up IDs", danger: "May break SVGs using external CSS/JS references" },
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function SvgOptimizerTool() {
  const [svgInput, setSvgInput] = React.useState("");
  const [opts, setOpts] = React.useState<OptOptions>(DEFAULT_OPTS);
  const [result, setResult] = React.useState<{ data: string; savings: number; origSize: number; optSize: number } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [running, setRunning] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [tab, setTab] = React.useState<"input" | "output">("input");
  const fileRef = React.useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    const reader = new FileReader();
    reader.onload = e => { setSvgInput(String(e.target?.result ?? "")); setResult(null); setError(null); };
    reader.readAsText(f);
  }

  async function optimize() {
    if (!svgInput.trim()) return;
    setRunning(true); setError(null);
    try {
      // MUST import from svgo/browser — not svgo
      const { optimize: svgoOptimize } = await import("svgo/browser");
      const origSize = new Blob([svgInput]).size;
      const plugins = OPTION_META.filter(m => typeof opts[m.key] === "boolean" && opts[m.key]).map(m => {
        if (m.key === "convertPathData") return { name: "convertPathData", params: { floatPrecision: opts.precision } };
        return { name: m.key };
      });
      const out = svgoOptimize(svgInput, { multipass: true, plugins } as Parameters<typeof svgoOptimize>[1]);
      const optSize = new Blob([out.data]).size;
      setResult({ data: out.data, savings: Math.round(((origSize - optSize) / origSize) * 100), origSize, optSize });
      setTab("output");
    } catch (e) { setError((e as Error).message); }
    finally { setRunning(false); }
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.data);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    if (!result) return;
    downloadBlob(new Blob([result.data], { type: "image/svg+xml" }), "optimized.svg");
  }

  const svgDataUrl = (s: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Input area */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            <button id="svg-tab-input" onClick={() => setTab("input")}
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors", tab === "input" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>Input SVG</button>
            <button id="svg-tab-output" onClick={() => setTab("output")} disabled={!result}
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-40", tab === "output" && result ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>Optimised SVG</button>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 ml-auto" onClick={() => fileRef.current?.click()} id="svg-upload">
            <Upload className="h-3.5 w-3.5" />Upload .svg
          </Button>
          <input ref={fileRef} type="file" accept=".svg,image/svg+xml" className="sr-only"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>

        {tab === "input" ? (
          <textarea
            id="svg-input"
            value={svgInput}
            onChange={e => { setSvgInput(e.target.value); setResult(null); }}
            placeholder="Paste SVG code here or upload a file above…"
            className="w-full h-56 rounded-md border border-input bg-background px-3 py-2.5 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            spellCheck={false}
          />
        ) : result ? (
          <div className="space-y-2">
            <textarea readOnly value={result.data}
              className="w-full h-56 rounded-md border border-input bg-background px-3 py-2.5 font-mono text-xs leading-relaxed resize-none" spellCheck={false} />
          </div>
        ) : null}
      </div>

      {/* Side-by-side SVG render */}
      {svgInput && result && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Original", src: svgDataUrl(svgInput), size: result.origSize },
            { label: "Optimised", src: svgDataUrl(result.data), size: result.optSize },
          ].map(({ label, src, size }) => (
            <div key={label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-mono text-muted-foreground">{formatSize(size)}</span>
              </div>
              <div className="rounded-lg border border-border/60 bg-secondary/10 flex items-center justify-center" style={{ height: 140 }}>
                <img src={src} alt={label} className="max-w-full max-h-full p-3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Savings badge */}
      {result && (
        <div className={cn("rounded-lg border px-4 py-3 flex flex-wrap items-center justify-between gap-3",
          result.savings > 0 ? "border-green-500/30 bg-green-500/5" : "border-border/60 bg-card")}>
          <div>
            <p className={cn("text-lg font-bold", result.savings > 0 ? "text-green-500" : "text-muted-foreground")}>
              {result.savings > 0 ? `Reduced by ${result.savings}%` : result.savings === 0 ? "No change" : `Increased by ${Math.abs(result.savings)}%`}
            </p>
            <p className="text-xs text-muted-foreground">{formatSize(result.origSize)} → {formatSize(result.optSize)}</p>
          </div>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={copy} id="svg-copy">
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}Copy
            </Button>
            <Button size="sm" className="h-8 text-xs gap-1" onClick={download} id="svg-download">
              <Download className="h-3.5 w-3.5" />Download
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-destructive font-mono">{error}</p>}

      {/* Options */}
      <div className="rounded-lg border border-border/60 bg-card px-5 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Optimisation options</span>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setOpts(DEFAULT_OPTS)}>Reset defaults</Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
          {OPTION_META.map(({ key, label, danger }) => (
            <label key={key} className={cn("flex items-center gap-2 cursor-pointer select-none", danger ? "col-span-2" : "")}>
              <input type="checkbox" checked={Boolean(opts[key])} onChange={e => setOpts(o => ({ ...o, [key]: e.target.checked }))}
                className="rounded" id={`svg-opt-${key}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
              {danger && opts[key] && (
                <span className="flex items-center gap-1 text-[10px] text-amber-500"><TriangleAlert className="h-3 w-3" />{danger}</span>
              )}
            </label>
          ))}
        </div>
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">Number precision (decimal places)</label>
            <span className="text-xs font-mono">{opts.precision}</span>
          </div>
          <Slider min={1} max={8} step={1} value={[opts.precision]} onValueChange={([v]) => setOpts(o => ({ ...o, precision: v }))} id="svg-precision" />
        </div>
      </div>

      {/* Run button */}
      <Button onClick={optimize} disabled={!svgInput.trim() || running} id="svg-optimize" className="w-full sm:w-auto">
        {running ? "Optimising…" : "Optimise SVG"}
      </Button>
    </div>
  );
}
