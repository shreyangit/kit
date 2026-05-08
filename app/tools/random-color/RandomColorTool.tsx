"use client";
import * as React from "react";
import { Copy, Check, RefreshCw, Lock, Unlock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { downloadText } from "@/lib/utils/download";

type Harmony = "random" | "analogous" | "complementary" | "triadic" | "monochromatic" | "pastel" | "earth" | "neon";

interface Color { hex: string; r: number; g: number; b: number; h: number; s: number; l: number; locked: boolean; }

function rand() { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 0xFFFFFFFF; }
function randInt(min: number, max: number) { return min + Math.floor(rand() * (max - min + 1)); }
function randHue() { return randInt(0, 359); }

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const hue2rgb = (p: number, q: number, t: number) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1/6) return p + (q-p)*6*t; if (t < 1/2) return q; if (t < 2/3) return p + (q-p)*(2/3-t)*6; return p; };
    r = hue2rgb(p, q, h + 1/3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r*255), Math.round(g*255), Math.round(b*255)];
}

function toHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
}

function makeColor(h: number, s: number, l: number): Color {
  const [r, g, b] = hslToRgb(h, s, l);
  return { hex: toHex(r, g, b), r, g, b, h: Math.round(h), s: Math.round(s), l: Math.round(l), locked: false };
}

function generate(harmony: Harmony, count: number, baseHue?: number): Color[] {
  const hue = baseHue ?? randHue();
  switch (harmony) {
    case "analogous": return Array.from({ length: count }, (_, i) => makeColor((hue + (i - Math.floor(count / 2)) * 30 + 360) % 360, 60 + rand() * 20, 45 + rand() * 20));
    case "complementary": {
      const cols = [makeColor(hue, 70, 50), makeColor((hue + 180) % 360, 70, 50), makeColor(hue, 70, 70), makeColor((hue + 180) % 360, 70, 30), makeColor(hue, 40, 85)];
      return cols.slice(0, count);
    }
    case "triadic": return [0, 120, 240].flatMap(o => [makeColor((hue + o) % 360, 70, 50), makeColor((hue + o) % 360, 70, 70)]).slice(0, count);
    case "monochromatic": return Array.from({ length: count }, (_, i) => makeColor(hue, 60, 20 + (i / Math.max(count - 1, 1)) * 70));
    case "pastel": return Array.from({ length: count }, () => makeColor(randHue(), 30 + rand() * 20, 75 + rand() * 15));
    case "earth": return Array.from({ length: count }, () => makeColor(20 + rand() * 60, 30 + rand() * 30, 30 + rand() * 40));
    case "neon": return Array.from({ length: count }, () => makeColor(randHue(), 90 + rand() * 10, 55 + rand() * 15));
    default: return Array.from({ length: count }, () => makeColor(randHue(), 50 + rand() * 40, 35 + rand() * 40));
  }
}

const HARMONIES: { id: Harmony; label: string; desc: string }[] = [
  { id: "random", label: "Random", desc: "Fully random" },
  { id: "analogous", label: "Analogous", desc: "Adjacent hues" },
  { id: "complementary", label: "Complementary", desc: "Opposite hues" },
  { id: "triadic", label: "Triadic", desc: "120° apart" },
  { id: "monochromatic", label: "Mono", desc: "One hue, varied L" },
  { id: "pastel", label: "Pastel", desc: "Soft, light" },
  { id: "earth", label: "Earth", desc: "Warm, muted" },
  { id: "neon", label: "Neon", desc: "Vibrant" },
];

function CopyBtn({ text, size = "sm" }: { text: string; size?: "sm" | "xs" }) {
  const [copied, setCopied] = React.useState(false);
  const s = size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5";
  return (
    <button onClick={async (e) => { e.stopPropagation(); await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
      className="p-1 rounded bg-black/10 hover:bg-black/20 text-white/80 hover:text-white transition-colors">
      {copied ? <Check className={s} /> : <Copy className={s} />}
    </button>
  );
}

export function RandomColorTool() {
  const [harmony, setHarmony] = React.useState<Harmony>("analogous");
  const [count, setCount] = React.useState(5);
  const [baseHue, setBaseHue] = React.useState<number | undefined>(undefined);
  const [useBaseHue, setUseBaseHue] = React.useState(false);
  const [colors, setColors] = React.useState<Color[]>([]);
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);
  const [exportTab, setExportTab] = React.useState<"css" | "tailwind" | "json">("css");

  React.useEffect(() => {
    setColors(generate(harmony, count, useBaseHue ? baseHue : undefined));
  }, [harmony, count]);

  function regen() {
    setColors(prev => {
      const fresh = generate(harmony, count, useBaseHue ? baseHue : undefined);
      return fresh.map((c, i) => prev[i]?.locked ? prev[i] : c);
    });
  }

  function toggleLock(i: number) { setColors(cs => cs.map((c, j) => j === i ? { ...c, locked: !c.locked } : c)); }

  const luminance = (c: Color) => (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
  const textColor = (c: Color) => luminance(c) > 0.55 ? "rgba(0,0,0,0.75)" : "rgba(255,255,255,0.90)";

  const exportSnippets: Record<string, string> = {
    css: `:root {\n${colors.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join("\n")}\n}`,
    tailwind: `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${colors.map((c, i) => `        "palette-${i + 1}": "${c.hex}",`).join("\n")}\n      },\n    },\n  },\n}`,
    json: JSON.stringify(colors.map(c => ({ hex: c.hex, rgb: [c.r, c.g, c.b], hsl: [c.h, c.s, c.l] })), null, 2),
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Harmony */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Harmony</p>
        <div className="flex flex-wrap gap-1.5">
          {HARMONIES.map(h => (
            <button key={h.id} onClick={() => setHarmony(h.id)} title={h.desc}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${harmony === h.id ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1.5 w-full sm:w-auto">
          <div className="flex justify-between text-xs text-muted-foreground"><span>Count</span><span>{count}</span></div>
          <Slider min={2} max={10} step={1} value={[count]} onValueChange={([v]) => setCount(v)} className="w-full sm:w-40" />
        </div>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={useBaseHue} onChange={e => setUseBaseHue(e.target.checked)} className="rounded" />
            Fix base hue
          </label>
          {useBaseHue && (
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={359} value={baseHue ?? 0} onChange={e => setBaseHue(parseInt(e.target.value))}
                className="w-32" />
              <span className="text-xs font-mono text-muted-foreground w-8">{baseHue ?? 0}°</span>
            </div>
          )}
        </div>
        <Button onClick={regen} className="gap-1.5" id="color-regen">
          <RefreshCw className="h-4 w-4" />Regenerate
        </Button>
      </div>

      {/* Swatches */}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(count, 5)}, 1fr)` }}>
        {colors.map((c, i) => (
          <div key={i} className="relative flex-1 min-w-[60px] rounded-lg overflow-hidden cursor-pointer group transition-all"
            style={{ height: "120px", background: c.hex }}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}>
            {/* Lock */}
            <button onClick={() => toggleLock(i)} style={{ color: textColor(c) }}
              className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-black/15">
              {c.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
            </button>
            {/* Values on hover */}
            {hoverIdx === i && (
              <div className="absolute inset-0 flex flex-col justify-end p-2 gap-0.5"
                style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.5))" }}>
                {[
                  c.hex.toUpperCase(),
                  `rgb(${c.r},${c.g},${c.b})`,
                  `hsl(${c.h},${c.s}%,${c.l}%)`,
                ].map(v => (
                  <div key={v} className="flex items-center justify-between gap-1">
                    <span className="text-[10px] text-white/80 font-mono">{v}</span>
                    <CopyBtn text={v} size="xs" />
                  </div>
                ))}
              </div>
            )}
            {/* HEX label always */}
            {hoverIdx !== i && (
              <div className="absolute bottom-2 left-0 right-0 text-center">
                <span className="text-[10px] font-mono" style={{ color: textColor(c) }}>{c.hex.toUpperCase()}</span>
              </div>
            )}
            {c.locked && (
              <div className="absolute top-2 left-2">
                <Lock className="h-3 w-3" style={{ color: textColor(c) }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Export */}
      <div className="space-y-2">
        <div className="flex gap-1.5">
          {(["css", "tailwind", "json"] as const).map(t => (
            <button key={t} onClick={() => setExportTab(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium uppercase transition-colors ${exportTab === t ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="relative">
          <textarea readOnly value={exportSnippets[exportTab]}
            className="w-full h-28 rounded-md border border-input bg-background px-3 py-2.5 font-mono text-xs leading-relaxed resize-none focus:outline-none"
            spellCheck={false} />
          <div className="absolute top-2 right-2 flex gap-1">
            <button onClick={async () => { await navigator.clipboard.writeText(exportSnippets[exportTab]); }}
              className="p-1.5 rounded bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors">
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => downloadText(exportSnippets[exportTab], `palette.${exportTab === "tailwind" ? "js" : exportTab}`)}
              className="p-1.5 rounded bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors">
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
