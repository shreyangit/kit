"use client";
import * as React from "react";
import { Copy, Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface Corners { tl: number; tr: number; br: number; bl: number; }
type Unit = "px" | "%";

const PRESETS: { label: string; corners: Corners; unit: Unit }[] = [
  { label: "None",    corners: { tl: 0, tr: 0, br: 0, bl: 0 }, unit: "px" },
  { label: "Subtle",  corners: { tl: 4, tr: 4, br: 4, bl: 4 }, unit: "px" },
  { label: "Rounded", corners: { tl: 8, tr: 8, br: 8, bl: 8 }, unit: "px" },
  { label: "Large",   corners: { tl: 16, tr: 16, br: 16, bl: 16 }, unit: "px" },
  { label: "Pill",    corners: { tl: 9999, tr: 9999, br: 9999, bl: 9999 }, unit: "px" },
  { label: "Circle",  corners: { tl: 50, tr: 50, br: 50, bl: 50 }, unit: "%" },
  { label: "Ticket",  corners: { tl: 0, tr: 50, br: 50, bl: 0 }, unit: "px" },
  { label: "Leaf",    corners: { tl: 0, tr: 60, br: 0, bl: 60 }, unit: "%" },
  { label: "Blob",    corners: { tl: 30, tr: 70, br: 30, bl: 70 }, unit: "%" },
];

function buildShorthand(c: Corners, u: Unit) {
  const { tl, tr, br, bl } = c;
  if (tl === tr && tr === br && br === bl) return `${tl}${u}`;
  if (tl === br && tr === bl) return `${tl}${u} ${tr}${u}`;
  if (tr === bl) return `${tl}${u} ${tr}${u} ${br}${u}`;
  return `${tl}${u} ${tr}${u} ${br}${u} ${bl}${u}`;
}

export function BorderRadiusTool() {
  const [corners, setCorners] = React.useState<Corners>({ tl: 8, tr: 8, br: 8, bl: 8 });
  const [unit, setUnit] = React.useState<Unit>("px");
  const [linked, setLinked] = React.useState(true);
  const [copied, setCopied] = React.useState<"shorthand" | "individual" | null>(null);
  const [boxColor, setBoxColor] = React.useState("#3b82f6");

  function setCorner(key: keyof Corners, val: number) {
    if (linked) setCorners({ tl: val, tr: val, br: val, bl: val });
    else setCorners(c => ({ ...c, [key]: val }));
  }

  const shorthand = buildShorthand(corners, unit);
  const css = `border-radius: ${shorthand};`;
  const individual = [
    `border-top-left-radius: ${corners.tl}${unit};`,
    `border-top-right-radius: ${corners.tr}${unit};`,
    `border-bottom-right-radius: ${corners.br}${unit};`,
    `border-bottom-left-radius: ${corners.bl}${unit};`,
  ].join("\n");

  const maxVal = unit === "%" ? 50 : 200;

  async function copy(text: string, which: "shorthand" | "individual") {
    await navigator.clipboard.writeText(text);
    setCopied(which); setTimeout(() => setCopied(null), 1500);
  }

  const previewStyle: React.CSSProperties = {
    borderTopLeftRadius: `${corners.tl}${unit}`,
    borderTopRightRadius: `${corners.tr}${unit}`,
    borderBottomRightRadius: `${corners.br}${unit}`,
    borderBottomLeftRadius: `${corners.bl}${unit}`,
    background: boxColor,
    width: 160,
    height: 120,
    transition: "border-radius 0.2s ease",
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Preview */}
      <div className="rounded-lg border border-border/60 bg-secondary/10 p-8 flex items-center justify-center min-h-48">
        <div style={previewStyle} />
      </div>

      {/* Preview color + unit + link */}
      <div className="flex flex-wrap gap-4 items-center text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Color</span>
          <input type="color" value={boxColor} onChange={e => setBoxColor(e.target.value)}
            className="h-7 w-12 rounded border border-input cursor-pointer" />
        </div>
        <div className="flex gap-1">
          {(["px", "%"] as Unit[]).map(u => (
            <button key={u} onClick={() => { setUnit(u); setCorners({ tl: 8, tr: 8, br: 8, bl: 8 }); }}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${unit === u ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {u}
            </button>
          ))}
        </div>
        <button onClick={() => setLinked(l => !l)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${linked ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
          <Link2 className="h-3 w-3" />{linked ? "Linked" : "Independent"}
        </button>
      </div>

      {/* Sliders */}
      <div className="rounded-lg border border-border/60 bg-card px-5 py-4 space-y-4">
        {([["Top left", "tl"], ["Top right", "tr"], ["Bottom right", "br"], ["Bottom left", "bl"]] as [string, keyof Corners][]).map(([label, key]) => (
          <div key={key} className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{label}</span>
              <span>{corners[key]}{unit}</span>
            </div>
            <Slider min={0} max={maxVal} value={[corners[key]]}
              onValueChange={([v]) => setCorner(key, v)} />
          </div>
        ))}
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => { setCorners(p.corners); setUnit(p.unit); setLinked(p.corners.tl === p.corners.tr && p.corners.tr === p.corners.br); }}
            className="px-2.5 py-1 rounded-md border border-border/60 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
            {p.label}
          </button>
        ))}
      </div>

      {/* Output */}
      <div className="rounded-lg border border-border/60 bg-card px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <code className="text-xs font-mono text-muted-foreground">{css}</code>
          <Button variant="ghost" size="sm" onClick={() => copy(css, "shorthand")} className="gap-1.5 shrink-0">
            {copied === "shorthand" ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}Copy
          </Button>
        </div>
        <div className="flex items-start justify-between border-t border-border/40 pt-2">
          <pre className="text-[11px] font-mono text-muted-foreground leading-relaxed">{individual}</pre>
          <Button variant="ghost" size="sm" onClick={() => copy(individual, "individual")} className="gap-1.5 shrink-0 mt-0.5">
            {copied === "individual" ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}Copy all
          </Button>
        </div>
      </div>
    </div>
  );
}
