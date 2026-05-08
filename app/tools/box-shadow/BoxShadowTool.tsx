"use client";
import * as React from "react";
import { Copy, Check, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface Layer {
  id: string; inset: boolean; offsetX: number; offsetY: number;
  blur: number; spread: number; color: string; opacity: number; visible: boolean;
}

const PRESETS: { label: string; layers: Omit<Layer, "id" | "visible">[] }[] = [
  { label: "None", layers: [] },
  { label: "Subtle", layers: [{ inset: false, offsetX: 0, offsetY: 1, blur: 3, spread: 0, color: "#000000", opacity: 0.08 }] },
  { label: "Small", layers: [{ inset: false, offsetX: 0, offsetY: 2, blur: 4, spread: 0, color: "#000000", opacity: 0.12 }] },
  { label: "Medium", layers: [{ inset: false, offsetX: 0, offsetY: 4, blur: 8, spread: 0, color: "#000000", opacity: 0.16 }] },
  { label: "Large", layers: [{ inset: false, offsetX: 0, offsetY: 8, blur: 24, spread: -4, color: "#000000", opacity: 0.20 }] },
  { label: "XL", layers: [{ inset: false, offsetX: 0, offsetY: 16, blur: 48, spread: -8, color: "#000000", opacity: 0.24 }] },
  { label: "Glow Blue", layers: [{ inset: false, offsetX: 0, offsetY: 0, blur: 20, spread: 0, color: "#3B82F6", opacity: 0.50 }] },
  { label: "Glow Violet", layers: [{ inset: false, offsetX: 0, offsetY: 0, blur: 20, spread: 0, color: "#8B5CF6", opacity: 0.50 }] },
  { label: "Inset", layers: [{ inset: true, offsetX: 0, offsetY: 2, blur: 4, spread: 0, color: "#000000", opacity: 0.15 }] },
  { label: "Layered", layers: [
    { inset: false, offsetX: 0, offsetY: 1, blur: 2, spread: 0, color: "#000000", opacity: 0.05 },
    { inset: false, offsetX: 0, offsetY: 4, blur: 8, spread: 0, color: "#000000", opacity: 0.10 },
    { inset: false, offsetX: 0, offsetY: 16, blur: 32, spread: 0, color: "#000000", opacity: 0.10 },
  ]},
];

function layerToCSS(l: Layer) {
  const hex = l.color.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
  return `${l.inset ? "inset " : ""}${l.offsetX}px ${l.offsetY}px ${l.blur}px ${l.spread}px rgba(${r},${g},${b},${l.opacity.toFixed(2)})`;
}

function buildCSS(layers: Layer[]) {
  const visible = layers.filter(l => l.visible);
  if (!visible.length) return "none";
  return visible.map(layerToCSS).join(", ");
}

function newLayer(): Layer {
  return { id: Math.random().toString(36).slice(2), inset: false, offsetX: 0, offsetY: 4, blur: 8, spread: 0, color: "#000000", opacity: 0.15, visible: true };
}

export function BoxShadowTool() {
  const [layers, setLayers] = React.useState<Layer[]>([newLayer()]);
  const [boxColor, setBoxColor] = React.useState("#ffffff");
  const [boxRadius, setBoxRadius] = React.useState(8);
  const [copiedCSS, setCopiedCSS] = React.useState(false);
  const [copiedTW, setCopiedTW] = React.useState(false);

  function update(id: string, key: keyof Layer, val: unknown) {
    setLayers(ls => ls.map(l => l.id === id ? { ...l, [key]: val } : l));
  }
  function remove(id: string) { setLayers(ls => ls.filter(l => l.id !== id)); }
  function addLayer() { setLayers(ls => ls.length < 8 ? [...ls, newLayer()] : ls); }

  function applyPreset(preset: typeof PRESETS[number]) {
    setLayers(preset.layers.map(l => ({ ...l, id: Math.random().toString(36).slice(2), visible: true })));
  }

  const cssValue = buildCSS(layers);
  const cssLine = `box-shadow: ${cssValue};`;
  const twLine = `shadow-[${cssValue.replace(/,\s*/g, ",").replace(/\s+/g, "_")}]`;

  async function copy(text: string, which: "css" | "tw") {
    await navigator.clipboard.writeText(text);
    if (which === "css") { setCopiedCSS(true); setTimeout(() => setCopiedCSS(false), 1500); }
    else { setCopiedTW(true); setTimeout(() => setCopiedTW(false), 1500); }
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Preview */}
      <div className="rounded-lg border border-border/60 bg-secondary/10 p-8 flex items-center justify-center min-h-48">
        <div style={{ background: boxColor, borderRadius: boxRadius, boxShadow: cssValue, width: 160, height: 100 }} />
      </div>

      {/* Preview controls */}
      <div className="flex flex-wrap gap-4 items-center text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Box color</span>
          <input type="color" value={boxColor} onChange={e => setBoxColor(e.target.value)}
            className="h-7 w-12 rounded border border-input cursor-pointer" />
        </div>
        <div className="flex items-center gap-2">
          <span>Radius</span>
          <Slider min={0} max={50} value={[boxRadius]} onValueChange={([v]) => setBoxRadius(v)} className="w-24" />
          <span>{boxRadius}px</span>
        </div>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => applyPreset(p)}
            className="px-2.5 py-1 rounded-md border border-border/60 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
            {p.label}
          </button>
        ))}
      </div>

      {/* Layers */}
      <div className="space-y-2">
        {layers.map((l, idx) => (
          <div key={l.id} className="rounded-lg border border-border/60 bg-card px-4 py-3 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Layer {idx + 1}</span>
              <div className="flex items-center gap-2 ml-auto">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={l.inset} onChange={e => update(l.id, "inset", e.target.checked)} className="rounded" />Inset
                </label>
                <button onClick={() => update(l.id, "visible", !l.visible)}
                  className="p-1 rounded hover:bg-secondary text-muted-foreground transition-colors">
                  {l.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                {layers.length > 1 && (
                  <button onClick={() => remove(l.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {([["Offset X", "offsetX", -50, 50], ["Offset Y", "offsetY", -50, 50], ["Blur", "blur", 0, 100], ["Spread", "spread", -50, 50]] as [string, keyof Layer, number, number][]).map(([lbl, key, min, max]) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground"><span>{lbl}</span><span>{l[key] as number}px</span></div>
                  <Slider min={min} max={max} value={[l[key] as number]} onValueChange={([v]) => update(l.id, key, v)} />
                </div>
              ))}
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Color</span>
                <input type="color" value={l.color} onChange={e => update(l.id, "color", e.target.value)}
                  className="h-7 w-12 rounded border border-input cursor-pointer" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground"><span>Opacity</span><span>{Math.round(l.opacity * 100)}%</span></div>
                <Slider min={0} max={1} step={0.01} value={[l.opacity]} onValueChange={([v]) => update(l.id, "opacity", v)} />
              </div>
            </div>
          </div>
        ))}
        {layers.length < 8 && (
          <Button variant="outline" size="sm" onClick={addLayer} className="gap-1.5 w-full">
            <Plus className="h-3.5 w-3.5" />Add shadow layer
          </Button>
        )}
      </div>

      {/* Output */}
      <div className="rounded-lg border border-border/60 bg-card px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <code className="text-xs font-mono text-muted-foreground flex-1 mr-3 break-all">{cssLine}</code>
          <Button variant="ghost" size="sm" onClick={() => copy(cssLine, "css")} className="gap-1.5 shrink-0">
            {copiedCSS ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}CSS
          </Button>
        </div>
        <div className="flex items-center justify-between border-t border-border/40 pt-2">
          <code className="text-xs font-mono text-muted-foreground flex-1 mr-3 break-all">{twLine}</code>
          <Button variant="ghost" size="sm" onClick={() => copy(twLine, "tw")} className="gap-1.5 shrink-0">
            {copiedTW ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}Tailwind
          </Button>
        </div>
      </div>
    </div>
  );
}
