"use client";

import * as React from "react";
import { ArrowLeftRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// WCAG relative luminance
function sRGBtoLinear(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * sRGBtoLinear(r) + 0.7152 * sRGBtoLinear(g) + 0.0722 * sRGBtoLinear(b);
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = luminance(hex1), l2 = luminance(hex2);
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function isValidHex(h: string): boolean { return /^#[0-9A-Fa-f]{6}$/.test(h); }

interface WcagResult { level: string; passes: boolean; color: string; label: string }
function wcagResults(ratio: number): { aa: WcagResult; aaa: WcagResult; aaLarge: WcagResult; aaaLarge: WcagResult } {
  const make = (req: number, level: string): WcagResult => {
    const passes = ratio >= req;
    return { level, passes, color: passes ? "text-green-500" : "text-destructive", label: passes ? "Pass" : "Fail" };
  };
  return { aa: make(4.5, "AA"), aaa: make(7, "AAA"), aaLarge: make(3, "AA Large"), aaaLarge: make(4.5, "AAA Large") };
}

function hexToRgb(hex: string): string {
  return `rgb(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)})`;
}

const PALETTE_PAIRS = [
  { fg: "#ffffff", bg: "#000000" }, { fg: "#000000", bg: "#ffffff" },
  { fg: "#ffffff", bg: "#0f172a" }, { fg: "#f8fafc", bg: "#1e293b" },
  { fg: "#fbbf24", bg: "#1e293b" }, { fg: "#3b82f6", bg: "#ffffff" },
  { fg: "#10b981", bg: "#ffffff" }, { fg: "#ef4444", bg: "#ffffff" },
];

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = React.useState(false);
  async function copy() { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1200); }
  return (
    <button onClick={copy} className="text-muted-foreground hover:text-foreground transition-colors">
      {ok ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export function ColorContrastTool() {
  const [fg, setFg] = React.useState("#ffffff");
  const [bg, setBg] = React.useState("#0f172a");
  const [fgInput, setFgInput] = React.useState("#ffffff");
  const [bgInput, setBgInput] = React.useState("#0f172a");

  function applyFg(val: string) { setFgInput(val); if (isValidHex(val)) setFg(val); }
  function applyBg(val: string) { setBgInput(val); if (isValidHex(val)) setBg(val); }

  const validFg = isValidHex(fg), validBg = isValidHex(bg);
  const ratio = (validFg && validBg) ? contrastRatio(fg, bg) : 0;
  const results = wcagResults(ratio);

  const ratingColor = ratio >= 7 ? "text-green-400" : ratio >= 4.5 ? "text-teal-400" : ratio >= 3 ? "text-amber-400" : "text-destructive";
  const ratingLabel = ratio >= 7 ? "Excellent" : ratio >= 4.5 ? "Good" : ratio >= 3 ? "Marginal" : "Poor";

  function swap() { const t = fg; setFg(bg); setBg(t); setFgInput(bg); setBgInput(t); }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Live preview */}
      <div
        className="rounded-xl p-8 flex flex-col items-center justify-center gap-3 border border-border/40 transition-colors duration-200"
        style={{ background: validBg ? bg : "#000000" }}
      >
        <p className="text-2xl sm:text-3xl font-bold" style={{ color: validFg ? fg : "#fff" }}>The quick brown fox</p>
        <p className="text-sm font-normal" style={{ color: validFg ? fg : "#fff" }}>Regular body text at 16px</p>
        <p className="text-xs" style={{ color: validFg ? fg : "#fff" }}>Small text at 12px — harder to read</p>
        <Button style={{ backgroundColor: validFg ? fg : undefined, color: validBg ? bg : undefined }} size="sm" className="mt-1">
          Sample Button
        </Button>
      </div>

      {/* Color pickers */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Foreground (Text)", val: fg, inputVal: fgInput, set: applyFg, setColor: setFg },
          { label: "Background", val: bg, inputVal: bgInput, set: applyBg, setColor: setBg },
        ].map(({ label, val, inputVal, set, setColor }) => (
          <div key={label} className="space-y-2">
            <label className="text-xs text-muted-foreground">{label}</label>
            <div className="flex items-center gap-2">
              <input type="color" value={val} onChange={e => { set(e.target.value); }} className="h-9 w-12 rounded border border-input cursor-pointer bg-background p-0.5" />
              <div className="flex items-center gap-1 flex-1 rounded-md border border-input bg-background px-2 py-1.5">
                <input
                  type="text" value={inputVal}
                  onChange={e => set(e.target.value)}
                  className="flex-1 font-mono text-sm bg-transparent focus:outline-none w-full"
                  maxLength={7}
                />
                <CopyBtn text={val} />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">{hexToRgb(val)}</p>
          </div>
        ))}
      </div>

      {/* Swap */}
      <div className="flex justify-center">
        <Button variant="outline" size="sm" onClick={swap} id="contrast-swap" className="gap-1.5">
          <ArrowLeftRight className="h-3.5 w-3.5" />Swap colors
        </Button>
      </div>

      {/* Ratio display */}
      <div className="rounded-lg border border-border/60 bg-card px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Contrast ratio</p>
          <p className={cn("text-4xl font-mono font-bold mt-1", ratingColor)}>{ratio.toFixed(2)}<span className="text-lg text-muted-foreground">:1</span></p>
        </div>
        <div className="text-right">
          <p className={cn("text-xl font-semibold", ratingColor)}>{ratingLabel}</p>
          <p className="text-xs text-muted-foreground mt-1">WCAG 2.1 compliance</p>
        </div>
      </div>

      {/* WCAG levels */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { key: "aa", label: "AA Normal", req: "≥ 4.5:1", r: results.aa },
          { key: "aaa", label: "AAA Normal", req: "≥ 7:1", r: results.aaa },
          { key: "aaLarge", label: "AA Large", req: "≥ 3:1", r: results.aaLarge },
          { key: "aaaLarge", label: "AAA Large", req: "≥ 4.5:1", r: results.aaaLarge },
        ].map(({ key, label, req, r }) => (
          <div key={key} id={`contrast-${key}`} className={cn("rounded-lg border px-3 py-3 text-center",
            r.passes ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5")}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className={cn("text-lg font-bold mt-1", r.color)}>{r.label}</p>
            <p className="text-[10px] text-muted-foreground">{req}</p>
          </div>
        ))}
      </div>

      {/* Quick palette pairs */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Common pairs</span>
        <div className="flex flex-wrap gap-2">
          {PALETTE_PAIRS.map(p => {
            const r = contrastRatio(p.fg, p.bg);
            return (
              <button key={`${p.fg}${p.bg}`} onClick={() => { setFg(p.fg); setBg(p.bg); setFgInput(p.fg); setBgInput(p.bg); }}
                className="h-8 w-16 rounded border border-border/60 hover:border-primary/40 transition-colors flex items-center justify-center text-[10px] font-mono font-semibold"
                style={{ background: p.bg, color: p.fg }}>
                {r.toFixed(1)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
