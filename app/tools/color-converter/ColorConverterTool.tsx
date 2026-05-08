"use client";

import * as React from "react";
import { Copy, Check, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ── Color math ──────────────────────────────────────────────────────────────

type RGB = { r: number; g: number; b: number };
type HSL = { h: number; s: number; l: number };
type HSV = { h: number; s: number; v: number };
type CMYK = { c: number; m: number; y: number; k: number };

function clamp(v: number, lo = 0, hi = 255) { return Math.min(hi, Math.max(lo, v)); }
function round(v: number, d = 0) { return parseFloat(v.toFixed(d)); }

function hexToRgb(hex: string): RGB | null {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgbToHex({ r, g, b }: RGB) {
  return "#" + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, "0")).join("");
}
function rgbToHsl({ r, g, b }: RGB): HSL {
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === rr ? ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6
    : max === gg ? ((bb - rr) / d + 2) / 6
    : ((rr - gg) / d + 4) / 6;
  return { h: round(h * 360), s: round(s * 100), l: round(l * 100) };
}
function hslToRgb({ h, s, l }: HSL): RGB {
  const ss = s / 100, ll = l / 100;
  if (ss === 0) { const v = round(ll * 255); return { r: v, g: v, b: v }; }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
  const p = 2 * ll - q;
  const hf = h / 360;
  return {
    r: round(hue2rgb(p, q, hf + 1/3) * 255),
    g: round(hue2rgb(p, q, hf) * 255),
    b: round(hue2rgb(p, q, hf - 1/3) * 255),
  };
}
function rgbToHsv({ r, g, b }: RGB): HSV {
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  const h = max === min ? 0
    : max === rr ? ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6
    : max === gg ? ((bb - rr) / d + 2) / 6
    : ((rr - gg) / d + 4) / 6;
  return { h: round(h * 360), s: round(s * 100), v: round(max * 100) };
}
function rgbToCmyk({ r, g: g2, b }: RGB): CMYK {
  const rr = r / 255, gg = g2 / 255, bb = b / 255;
  const k = 1 - Math.max(rr, gg, bb);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: round(((1 - rr - k) / (1 - k)) * 100),
    m: round(((1 - gg - k) / (1 - k)) * 100),
    y: round(((1 - bb - k) / (1 - k)) * 100),
    k: round(k * 100),
  };
}
function cmykToRgb({ c, m, y, k }: CMYK): RGB {
  const kk = k / 100;
  return {
    r: round(255 * (1 - c / 100) * (1 - kk)),
    g: round(255 * (1 - m / 100) * (1 - kk)),
    b: round(255 * (1 - y / 100) * (1 - kk)),
  };
}

function relativeLuminance({ r, g, b }: RGB): number {
  const lin = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function contrastRatio(a: RGB, b: RGB): number {
  const l1 = relativeLuminance(a), l2 = relativeLuminance(b);
  return round((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05), 2);
}

const WHITE: RGB = { r: 255, g: 255, b: 255 };
const BLACK: RGB = { r: 0, g: 0, b: 0 };

function wcagRating(ratio: number): { aa: boolean; aaLarge: boolean; aaa: boolean; aaaLarge: boolean } {
  return { aa: ratio >= 4.5, aaLarge: ratio >= 3, aaa: ratio >= 7, aaaLarge: ratio >= 4.5 };
}

// ── Copy button ─────────────────────────────────────────────────────────────

function CopyBtn({ value, id }: { value: string; id: string }) {
  const [copied, setCopied] = React.useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button onClick={copy} id={id} className="p-1 rounded hover:bg-secondary transition-colors" aria-label={`Copy ${value}`}>
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
      </TooltipTrigger>
      <TooltipContent>Copy</TooltipContent>
    </Tooltip>
  );
}

// ── Number input ─────────────────────────────────────────────────────────────

function NumInput({ id, value, min, max, onChange }: { id: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  const [raw, setRaw] = React.useState(String(value));
  React.useEffect(() => setRaw(String(value)), [value]);
  return (
    <input
      id={id}
      type="number"
      value={raw}
      min={min}
      max={max}
      onChange={(e) => {
        setRaw(e.target.value);
        const n = parseFloat(e.target.value);
        if (!isNaN(n)) onChange(clamp(n, min, max));
      }}
      className="w-16 rounded border border-input bg-background px-2 py-1 text-xs font-mono text-center focus:outline-none focus:ring-1 focus:ring-ring"
    />
  );
}

// ── WCAG Badge ──────────────────────────────────────────────────────────────

function Badge({ pass, label }: { pass: boolean; label: string }) {
  return (
    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", pass ? "bg-green-500/15 text-green-600 dark:text-green-400" : "bg-red-500/10 text-red-500")}>
      {label} {pass ? "✓" : "✗"}
    </span>
  );
}

// ── History ─────────────────────────────────────────────────────────────────

const HISTORY_KEY = "kit:color-history";

function loadHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}
function saveToHistory(hex: string, prev: string[]): string[] {
  const next = [hex, ...prev.filter(h => h !== hex)].slice(0, 10);
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
  return next;
}

// ── Main ─────────────────────────────────────────────────────────────────────

export function ColorConverterTool() {
  const [rgb, setRgbState] = React.useState<RGB>({ r: 99, g: 102, b: 241 }); // indigo-500
  const [hexInput, setHexInput] = React.useState("#6366f1");
  const [hexError, setHexError] = React.useState(false);
  const [history, setHistory] = React.useState<string[]>([]);

  React.useEffect(() => { setHistory(loadHistory()); }, []);

  function setRgb(newRgb: RGB) {
    const hex = rgbToHex(newRgb);
    setRgbState(newRgb);
    setHexInput(hex);
    setHexError(false);
    setHistory(prev => saveToHistory(hex, prev));
  }

  function onHexChange(v: string) {
    setHexInput(v);
    const parsed = hexToRgb(v);
    if (parsed) { setRgbState(parsed); setHexError(false); setHistory(prev => saveToHistory(rgbToHex(parsed), prev)); }
    else setHexError(true);
  }

  const hsl = rgbToHsl(rgb);
  const hsv = rgbToHsv(rgb);
  const cmyk = rgbToCmyk(rgb);
  const hex = rgbToHex(rgb);

  const onWhite = contrastRatio(rgb, WHITE);
  const onBlack = contrastRatio(rgb, BLACK);
  const wcagW = wcagRating(onWhite);
  const wcagB = wcagRating(onBlack);

  const rgbStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  const hslStr = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  const hsvStr = `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`;
  const cmykStr = `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Swatch + hex input */}
      <div className="rounded-lg border border-border/60 overflow-hidden">
        <div className="h-24 w-full transition-colors duration-100" style={{ backgroundColor: hex }} />
        <div className="flex items-center gap-3 px-4 py-3 bg-card">
          <input
            type="color"
            value={hex}
            onChange={(e) => { onHexChange(e.target.value); }}
            className="h-9 w-9 rounded border border-border cursor-pointer bg-transparent"
            id="color-picker-native"
            title="Pick a color"
          />
          <div className="flex-1">
            <input
              id="color-hex-input"
              value={hexInput}
              onChange={(e) => onHexChange(e.target.value)}
              className={cn(
                "w-full bg-transparent font-mono text-sm text-foreground focus:outline-none placeholder:text-muted-foreground",
                hexError && "text-destructive"
              )}
              placeholder="#000000"
              spellCheck={false}
              maxLength={7}
            />
            {hexError && <p className="text-[10px] text-destructive">Invalid hex</p>}
          </div>
          <CopyBtn value={hex} id="copy-hex" />
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => { setRgb({ r: 99, g: 102, b: 241 }); setHexInput("#6366f1"); }} className="p-1 rounded hover:bg-secondary" id="color-reset-btn" aria-label="Reset">
                <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Reset</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Format tabs */}
      <Tabs defaultValue="rgb" id="color-tabs">
        <TabsList>
          <TabsTrigger value="rgb" id="color-tab-rgb">RGB</TabsTrigger>
          <TabsTrigger value="hsl" id="color-tab-hsl">HSL</TabsTrigger>
          <TabsTrigger value="hsv" id="color-tab-hsv">HSV</TabsTrigger>
          <TabsTrigger value="cmyk" id="color-tab-cmyk">CMYK</TabsTrigger>
        </TabsList>

        {/* RGB */}
        <TabsContent value="rgb" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-muted-foreground">{rgbStr}</span>
            <CopyBtn value={rgbStr} id="copy-rgb" />
          </div>
          {(["r", "g", "b"] as const).map((ch, i) => (
            <div key={ch} className="flex items-center gap-3">
              <span className="w-3 text-xs font-mono text-muted-foreground uppercase">{ch}</span>
              <div className="flex-1">
                <Slider
                  id={`rgb-${ch}`}
                  min={0} max={255} step={1}
                  value={[rgb[ch]]}
                  onValueChange={([v]) => setRgb({ ...rgb, [ch]: v })}
                  className={i === 0 ? "[&>[role=slider]]:bg-red-500" : i === 1 ? "[&>[role=slider]]:bg-green-500" : "[&>[role=slider]]:bg-blue-500"}
                />
              </div>
              <NumInput id={`rgb-${ch}-input`} value={rgb[ch]} min={0} max={255} onChange={(v) => setRgb({ ...rgb, [ch]: v })} />
            </div>
          ))}
        </TabsContent>

        {/* HSL */}
        <TabsContent value="hsl" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-muted-foreground">{hslStr}</span>
            <CopyBtn value={hslStr} id="copy-hsl" />
          </div>
          {([
            { key: "h" as const, label: "H°", min: 0, max: 360 },
            { key: "s" as const, label: "S%", min: 0, max: 100 },
            { key: "l" as const, label: "L%", min: 0, max: 100 },
          ]).map(({ key, label, min, max }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="w-6 text-xs font-mono text-muted-foreground">{label}</span>
              <div className="flex-1">
                <Slider id={`hsl-${key}`} min={min} max={max} step={1} value={[hsl[key]]} onValueChange={([v]) => setRgb(hslToRgb({ ...hsl, [key]: v }))} />
              </div>
              <NumInput id={`hsl-${key}-input`} value={hsl[key]} min={min} max={max} onChange={(v) => setRgb(hslToRgb({ ...hsl, [key]: v }))} />
            </div>
          ))}
        </TabsContent>

        {/* HSV */}
        <TabsContent value="hsv" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-muted-foreground">{hsvStr}</span>
            <CopyBtn value={hsvStr} id="copy-hsv" />
          </div>
          <p className="text-[10px] text-muted-foreground">HSV is derived from RGB. Edit via RGB or HSL tabs, or use the color picker.</p>
          {(["h", "s", "v"] as const).map((k) => (
            <div key={k} className="flex items-center gap-3">
              <span className="w-4 text-xs font-mono text-muted-foreground uppercase">{k}</span>
              <div className="flex-1 h-2 rounded-full bg-secondary" />
              <span className="font-mono text-xs w-12 text-right">{hsv[k]}{k !== "h" ? "%" : "°"}</span>
            </div>
          ))}
        </TabsContent>

        {/* CMYK */}
        <TabsContent value="cmyk" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-muted-foreground">{cmykStr}</span>
            <CopyBtn value={cmykStr} id="copy-cmyk" />
          </div>
          {(["c", "m", "y", "k"] as const).map((ch) => (
            <div key={ch} className="flex items-center gap-3">
              <span className="w-3 text-xs font-mono text-muted-foreground uppercase">{ch}</span>
              <div className="flex-1">
                <Slider
                  id={`cmyk-${ch}`}
                  min={0} max={100} step={1}
                  value={[cmyk[ch]]}
                  onValueChange={([v]) => setRgb(cmykToRgb({ ...cmyk, [ch]: v }))}
                />
              </div>
              <NumInput id={`cmyk-${ch}-input`} value={cmyk[ch]} min={0} max={100} onChange={(v) => setRgb(cmykToRgb({ ...cmyk, [ch]: v }))} />
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* All formats at a glance */}
      <div className="rounded-lg border border-border/60 bg-card divide-y divide-border/60">
        {[
          { label: "HEX", value: hex, id: "quick-hex" },
          { label: "RGB", value: rgbStr, id: "quick-rgb" },
          { label: "HSL", value: hslStr, id: "quick-hsl" },
          { label: "HSV", value: hsvStr, id: "quick-hsv" },
          { label: "CMYK", value: cmykStr, id: "quick-cmyk" },
        ].map(({ label, value, id }) => (
          <div key={id} className="group flex items-center justify-between px-4 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-12 shrink-0">{label}</span>
            <span className="flex-1 font-mono text-xs text-foreground">{value}</span>
            <CopyBtn value={value} id={id} />
          </div>
        ))}
      </div>

      {/* WCAG Contrast */}
      <div className="rounded-lg border border-border/60 bg-card px-4 py-4 space-y-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">WCAG Contrast</span>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "On white", ratio: onWhite, wcag: wcagW, bg: "bg-white", textColor: hex },
            { label: "On black", ratio: onBlack, wcag: wcagB, bg: "bg-black", textColor: hex },
          ].map(({ label, ratio, wcag, bg, textColor }) => (
            <div key={label} className="space-y-2">
              <div className={cn("rounded-md p-3", bg, "border border-border/60")}>
                <p className="text-sm font-semibold" style={{ color: textColor }}>Aa</p>
                <p className="text-xs" style={{ color: textColor }}>{label}</p>
              </div>
              <p className="font-mono text-xs text-foreground font-semibold">{ratio}:1</p>
              <div className="flex flex-wrap gap-1">
                <Badge pass={wcag.aa} label="AA" />
                <Badge pass={wcag.aaLarge} label="AA+" />
                <Badge pass={wcag.aaa} label="AAA" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">Recent</span>
          <div className="flex gap-1.5 flex-wrap">
            {history.map((h) => (
              <Tooltip key={h}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onHexChange(h)}
                    className="h-8 w-8 rounded-md border border-border/60 shadow-sm transition-transform hover:scale-110"
                    style={{ backgroundColor: h }}
                    id={`history-${h.replace("#", "")}`}
                    aria-label={h}
                  />
                </TooltipTrigger>
                <TooltipContent>{h}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
