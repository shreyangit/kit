"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }

const NAMED = [
  { r: "1:1", n: "Square", d: 1.0 }, { r: "4:3", n: "Standard SD", d: 1.333 },
  { r: "16:9", n: "HD Video", d: 1.778 }, { r: "16:10", n: "MacBook", d: 1.6 },
  { r: "21:9", n: "Ultrawide", d: 2.333 }, { r: "3:2", n: "DSLR / 35mm", d: 1.5 },
  { r: "9:16", n: "Mobile / Stories", d: 0.5625 }, { r: "4:5", n: "Instagram Portrait", d: 0.8 },
  { r: "2:3", n: "Portrait Photo", d: 0.667 }, { r: "5:4", n: "Old Monitor", d: 1.25 },
  { r: "3:4", n: "iPad Portrait", d: 0.75 },
];

const PRESETS = [
  { label: "16:9", w: 1920, h: 1080 }, { label: "4:3", w: 1024, h: 768 },
  { label: "1:1", w: 1080, h: 1080 }, { label: "9:16", w: 1080, h: 1920 },
  { label: "3:2", w: 3000, h: 2000 }, { label: "21:9", w: 2560, h: 1080 },
];

const EQUIV_WIDTHS = [360, 480, 640, 720, 1024, 1280, 1366, 1440, 1920, 2560, 3840];

export function AspectRatioTool() {
  const [w, setW] = React.useState("1920");
  const [h, setH] = React.useState("1080");
  // Find missing dimension
  const [fmKnown, setFmKnown] = React.useState("1280");
  const [fmSide, setFmSide] = React.useState<"w" | "h">("w");
  const [fmRatioStr, setFmRatioStr] = React.useState("16:9");

  const width = parseFloat(w) || 0;
  const height = parseFloat(h) || 0;

  const valid = width > 0 && height > 0;
  const decimal = valid ? width / height : 0;
  const div = valid ? gcd(Math.round(width), Math.round(height)) : 1;
  const ratioW = valid ? Math.round(width) / div : 0;
  const ratioH = valid ? Math.round(height) / div : 0;
  const simplified = valid ? `${ratioW}:${ratioH}` : "—";

  const closest = valid ? NAMED.reduce<typeof NAMED[0] | null>((best, cur) => {
    const diff = Math.abs(cur.d - decimal);
    if (diff > 0.05) return best;
    if (!best) return cur;
    return diff < Math.abs(best.d - decimal) ? cur : best;
  }, null) : null;

  const equivalents = valid ? EQUIV_WIDTHS.map(ew => ({ w: ew, h: Math.round(ew / decimal) })).filter(e => e.h > 0 && e.h < 5000) : [];

  // Find missing dimension
  const fmRatioParts = fmRatioStr.split(":").map(Number);
  const fmRW = fmRatioParts[0] || 16, fmRH = fmRatioParts[1] || 9;
  const fmKnownN = parseFloat(fmKnown) || 0;
  const fmResult = fmSide === "w" ? Math.round((fmKnownN * fmRH) / fmRW) : Math.round((fmKnownN * fmRW) / fmRH);

  // Visual rect
  const maxW = 240, maxH = 120;
  const rectW = valid ? Math.min(maxW, maxH * decimal) : maxW;
  const rectH = valid ? Math.min(maxH, maxW / decimal) : maxH;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Inputs */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground w-14">Width</label>
            <input id="ar-width" type="number" min={1} value={w} onChange={e => setW(e.target.value)}
              className="w-28 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <span className="text-muted-foreground">×</span>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground w-14">Height</label>
            <input id="ar-height" type="number" min={1} value={h} onChange={e => setH(e.target.value)}
              className="w-28 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <span className="text-xs text-muted-foreground">px</span>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(p => (
            <button key={p.label} id={`ar-preset-${p.label.replace(":", "-")}`}
              onClick={() => { setW(String(p.w)); setH(String(p.h)); }}
              className="px-3 py-1 rounded-md text-xs bg-secondary hover:bg-secondary/80 text-muted-foreground transition-colors">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {valid && (
        <div className="space-y-4 animate-fade-in">
          {/* Visual preview */}
          <div className="flex items-center justify-center rounded-lg border border-border/60 bg-secondary/10 py-6">
            <div
              className="rounded border-2 border-primary bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary"
              style={{ width: rectW, height: rectH }}
            >
              {simplified}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="rounded-lg border border-border/60 bg-card px-4 py-3" id="ar-simplified">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Simplified ratio</p>
              <p className="text-2xl font-bold font-mono mt-1">{simplified}</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-card px-4 py-3" id="ar-decimal">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Decimal</p>
              <p className="text-2xl font-bold font-mono mt-1">{decimal.toFixed(3)}</p>
            </div>
            {closest && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 sm:col-span-1 col-span-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Closest named ratio</p>
                <p className="text-sm font-semibold text-primary mt-1">{closest.r} — {closest.n}</p>
              </div>
            )}
          </div>

          {/* Equivalents */}
          <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
            <div className="px-4 py-2 bg-secondary/20 border-b border-border/60">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Equivalent resolutions at this ratio</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-border/40">
              {equivalents.slice(0, 12).map(e => (
                <div key={e.w} className="px-4 py-2.5 flex items-center justify-between">
                  <span className="font-mono text-xs text-foreground">{e.w} × {e.h}</span>
                  <button onClick={() => { setW(String(e.w)); setH(String(e.h)); }}
                    className="text-[10px] text-muted-foreground hover:text-primary transition-colors">use</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Find missing dimension */}
      <div className="rounded-lg border border-border/60 bg-card px-5 py-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Find missing dimension</p>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <select value={fmSide} onChange={e => setFmSide(e.target.value as "w" | "h")}
              className="rounded border border-input bg-background px-2 py-1.5 text-xs">
              <option value="w">Width</option>
              <option value="h">Height</option>
            </select>
            <input id="ar-fm-known" type="number" value={fmKnown} onChange={e => setFmKnown(e.target.value)}
              className="w-24 rounded border border-input bg-background px-2 py-1.5 font-mono text-xs text-center" />
            <span className="text-xs text-muted-foreground">at ratio</span>
            <input id="ar-fm-ratio" type="text" value={fmRatioStr} onChange={e => setFmRatioStr(e.target.value)}
              placeholder="16:9"
              className="w-20 rounded border border-input bg-background px-2 py-1.5 font-mono text-xs text-center" />
          </div>
          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-sm font-semibold text-primary" id="ar-fm-result">
              {fmSide === "w" ? "Height" : "Width"}: {fmResult || "—"} px
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
