"use client";

import * as React from "react";
import { Plus, Trash2, Copy, Check, Download, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { downloadBlob } from "@/lib/utils/download";
import { cn } from "@/lib/utils";

type GradType = "linear" | "radial" | "conic";

interface ColorStop {
  id: string;
  color: string;
  position: number;
}

const PRESETS: { name: string; stops: Omit<ColorStop, "id">[]; angle: number; type: GradType }[] = [
  { name: "Sunset", stops: [{ color: "#ff6b6b", position: 0 }, { color: "#ffd93d", position: 50 }, { color: "#ff6b6b", position: 100 }], angle: 135, type: "linear" },
  { name: "Ocean", stops: [{ color: "#0f3460", position: 0 }, { color: "#0e9aa7", position: 50 }, { color: "#f6f6f6", position: 100 }], angle: 135, type: "linear" },
  { name: "Forest", stops: [{ color: "#134e5e", position: 0 }, { color: "#71b280", position: 100 }], angle: 135, type: "linear" },
  { name: "Fire", stops: [{ color: "#f7971e", position: 0 }, { color: "#ffd200", position: 100 }], angle: 135, type: "linear" },
  { name: "Midnight", stops: [{ color: "#0f0c29", position: 0 }, { color: "#302b63", position: 50 }, { color: "#24243e", position: 100 }], angle: 180, type: "linear" },
  { name: "Cotton Candy", stops: [{ color: "#f8cdda", position: 0 }, { color: "#1d2b64", position: 100 }], angle: 135, type: "linear" },
  { name: "Neon Radial", stops: [{ color: "#00d2ff", position: 0 }, { color: "#3a7bd5", position: 100 }], angle: 0, type: "radial" },
  { name: "Aurora", stops: [{ color: "#00c9ff", position: 0 }, { color: "#92fe9d", position: 100 }], angle: 90, type: "linear" },
  { name: "Dusk", stops: [{ color: "#2c3e50", position: 0 }, { color: "#fd746c", position: 100 }], angle: 45, type: "linear" },
  { name: "Conic Rainbow", stops: [{ color: "#ff0000", position: 0 }, { color: "#ffff00", position: 25 }, { color: "#00ff00", position: 50 }, { color: "#0000ff", position: 75 }, { color: "#ff0000", position: 100 }], angle: 0, type: "conic" },
];

function uid() { return Math.random().toString(36).slice(2, 8); }

function buildCSS(stops: ColorStop[], type: GradType, angle: number, repeating: boolean, radialShape: string): string {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const stopsStr = sorted.map(s => `${s.color} ${s.position}%`).join(", ");
  const pfx = repeating ? "repeating-" : "";
  if (type === "linear") return `${pfx}linear-gradient(${angle}deg, ${stopsStr})`;
  if (type === "radial") return `${pfx}radial-gradient(${radialShape} at 50% 50%, ${stopsStr})`;
  return `${pfx}conic-gradient(from ${angle}deg, ${stopsStr})`;
}

function randomPastel(): string {
  const h = Math.floor(Math.random() * 360);
  return `hsl(${h}, 70%, 60%)`;
}

function randomGradient(): { stops: ColorStop[]; angle: number } {
  const count = 2 + Math.floor(Math.random() * 2);
  const stops: ColorStop[] = Array.from({ length: count }, (_, i) => ({
    id: uid(),
    color: randomPastel(),
    position: Math.round((i / (count - 1)) * 100),
  }));
  return { stops, angle: Math.floor(Math.random() * 360) };
}

export function GradientGeneratorTool() {
  const [type, setType] = React.useState<GradType>("linear");
  const [angle, setAngle] = React.useState(135);
  const [stops, setStops] = React.useState<ColorStop[]>([
    { id: uid(), color: "#0e9aa7", position: 0 },
    { id: uid(), color: "#3a1c71", position: 100 },
  ]);
  const [repeating, setRepeating] = React.useState(false);
  const [radialShape, setRadialShape] = React.useState("ellipse");
  const [copied, setCopied] = React.useState(false);

  const css = buildCSS(stops, type, angle, repeating, radialShape);
  const cssDecl = `background: ${css};`;

  function updateStop(id: string, field: keyof ColorStop, value: string | number) {
    setStops(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }
  function addStop() {
    setStops(prev => [...prev, { id: uid(), color: "#ffffff", position: 50 }]);
  }
  function removeStop(id: string) {
    if (stops.length <= 2) return;
    setStops(prev => prev.filter(s => s.id !== id));
  }

  async function copy() {
    await navigator.clipboard.writeText(cssDecl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function downloadPng() {
    const canvas = document.createElement("canvas");
    canvas.width = 800; canvas.height = 400;
    const ctx = canvas.getContext("2d")!;
    const grad = ctx.createLinearGradient(0, 0, 800, 0);
    const sorted = [...stops].sort((a, b) => a.position - b.position);
    sorted.forEach(s => grad.addColorStop(s.position / 100, s.color));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 400);
    canvas.toBlob(blob => { if (blob) downloadBlob(blob, "gradient.png"); }, "image/png");
  }

  function applyPreset(p: typeof PRESETS[0]) {
    setType(p.type);
    setAngle(p.angle);
    setStops(p.stops.map(s => ({ ...s, id: uid() })));
  }

  function shuffle() {
    const { stops: s, angle: a } = randomGradient();
    setStops(s); setAngle(a); setType("linear");
  }

  return (
    <div className="space-y-5">
      {/* Preview */}
      <div
        className="w-full rounded-xl border border-border/60 transition-all duration-300"
        style={{ background: css, height: "clamp(160px, 30vw, 260px)" }}
      />

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={type} onValueChange={v => setType(v as GradType)}>
          <TabsList>
            <TabsTrigger value="linear" id="grad-linear">Linear</TabsTrigger>
            <TabsTrigger value="radial" id="grad-radial">Radial</TabsTrigger>
            <TabsTrigger value="conic" id="grad-conic">Conic</TabsTrigger>
          </TabsList>
        </Tabs>

        {(type === "linear" || type === "conic") && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground whitespace-nowrap">Angle</label>
            <input type="range" min={0} max={360} value={angle} onChange={e => setAngle(+e.target.value)} className="w-24" id="grad-angle" />
            <input type="number" min={0} max={360} value={angle} onChange={e => setAngle(+e.target.value)} className="w-14 rounded border border-input bg-background px-2 py-1 text-xs font-mono text-center" />
            <span className="text-xs text-muted-foreground">°</span>
          </div>
        )}

        {type === "radial" && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Shape</label>
            <select value={radialShape} onChange={e => setRadialShape(e.target.value)} className="rounded border border-input bg-background px-2 py-1 text-xs">
              <option value="ellipse">Ellipse</option>
              <option value="circle">Circle</option>
            </select>
          </div>
        )}

        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={repeating} onChange={e => setRepeating(e.target.checked)} className="rounded" id="grad-repeating" />
          Repeating
        </label>
      </div>

      {/* Color stops */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Color Stops</span>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addStop} id="grad-add-stop">
            <Plus className="h-3.5 w-3.5" />Add stop
          </Button>
        </div>
        {stops.map(stop => (
          <div key={stop.id} className="flex items-center gap-3">
            <input
              type="color"
              value={stop.color}
              onChange={e => updateStop(stop.id, "color", e.target.value)}
              className="h-8 w-10 rounded border border-input cursor-pointer bg-background p-0.5"
            />
            <span className="font-mono text-xs text-muted-foreground w-14">{stop.color}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={stop.position}
              onChange={e => updateStop(stop.id, "position", +e.target.value)}
              className="flex-1"
            />
            <span className="font-mono text-xs w-8 text-right text-muted-foreground">{stop.position}%</span>
            <button onClick={() => removeStop(stop.id)} disabled={stops.length <= 2} className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-30">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* CSS output */}
      <div className="rounded-lg border border-border/60 bg-secondary/20 px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">CSS Output</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={shuffle} id="grad-shuffle">
              <Shuffle className="h-3.5 w-3.5" />Random
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={copy} id="grad-copy">
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy CSS"}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={downloadPng} id="grad-download">
              <Download className="h-3.5 w-3.5" />PNG
            </Button>
          </div>
        </div>
        <code className="block font-mono text-xs text-primary break-all">{cssDecl}</code>
        <code className="block font-mono text-xs text-muted-foreground/60 break-all">background-image: {css};</code>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Presets</span>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(p => (
            <button
              key={p.name}
              id={`grad-preset-${p.name.toLowerCase().replace(" ", "-")}`}
              onClick={() => applyPreset(p)}
              className="relative h-8 w-20 rounded-md overflow-hidden border border-border/60 hover:border-primary/40 transition-colors text-[10px] font-medium text-white"
              style={{ background: buildCSS(p.stops.map(s => ({ ...s, id: "" })), p.type, p.angle, false, "ellipse") }}
            >
              <span className="relative z-10 drop-shadow">{p.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
