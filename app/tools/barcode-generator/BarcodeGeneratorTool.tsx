"use client";
import * as React from "react";
import { Copy, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { downloadBlob } from "@/lib/utils/download";

type BarcodeFormat = "CODE128" | "CODE39" | "EAN13" | "EAN8" | "UPCA" | "UPCE" | "ITF14" | "MSI" | "pharmacode";

const FORMAT_META: { value: BarcodeFormat; label: string; hint: string }[] = [
  { value: "CODE128", label: "CODE128", hint: "Most versatile — all printable ASCII" },
  { value: "CODE39", label: "CODE39", hint: "A-Z, 0-9, special chars only" },
  { value: "EAN13", label: "EAN-13", hint: "Retail products — 12 digits (+ check)" },
  { value: "EAN8", label: "EAN-8", hint: "Compact retail — 7 digits (+ check)" },
  { value: "UPCA", label: "UPC-A", hint: "US retail — 11 digits (+ check)" },
  { value: "ITF14", label: "ITF-14", hint: "Shipping — 13 digits (+ check)" },
  { value: "MSI", label: "MSI", hint: "Inventory — digits only" },
  { value: "pharmacode", label: "Pharmacode", hint: "Pharmaceutical — integer 3–131070" },
];

const PRESETS = [
  { label: "Retail (EAN-13)", format: "EAN13" as BarcodeFormat, value: "012345678901" },
  { label: "Inventory (CODE128)", format: "CODE128" as BarcodeFormat, value: "INV-2024-00123" },
  { label: "Shipping (ITF-14)", format: "ITF14" as BarcodeFormat, value: "1234567890123" },
];

export function BarcodeGeneratorTool() {
  const [value, setValue] = React.useState("012345678901");
  const [format, setFormat] = React.useState<BarcodeFormat>("EAN13");
  const [barWidth, setBarWidth] = React.useState(2);
  const [barHeight, setBarHeight] = React.useState(100);
  const [showText, setShowText] = React.useState(true);
  const [bgColor, setBgColor] = React.useState("#ffffff");
  const [lineColor, setLineColor] = React.useState("#000000");
  const [margin, setMargin] = React.useState(10);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => render(), 200);
    return () => clearTimeout(debounceRef.current);
  }, [value, format, barWidth, barHeight, showText, bgColor, lineColor, margin]);

  function render() {
    if (!svgRef.current || !value.trim()) return;
    setError(null);
    try {
      // Dynamic import of JsBarcode
      import("jsbarcode").then(({ default: JsBarcode }) => {
        try {
          JsBarcode(svgRef.current!, value, {
            format, width: barWidth, height: barHeight, displayValue: showText,
            background: bgColor, lineColor, margin, fontSize: 14,
            valid: (v: boolean) => { if (!v) setError(`"${value}" is not valid for ${format}`); },
          });
          setError(null);
        } catch (e) { setError((e as Error).message); }
      });
    } catch (e) { setError((e as Error).message); }
  }

  function applySVG(): string {
    return svgRef.current ? new XMLSerializer().serializeToString(svgRef.current) : "";
  }

  async function downloadPng() {
    const svg = applySVG();
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth * 2; canvas.height = img.naturalHeight * 2;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(2, 2); ctx.drawImage(img, 0, 0);
      canvas.toBlob(b => { URL.revokeObjectURL(url); if (b) downloadBlob(b, `barcode.png`); }, "image/png");
    };
    img.src = url;
  }

  function downloadSvg() {
    const svg = applySVG();
    if (!svg) return;
    downloadBlob(new Blob([svg], { type: "image/svg+xml" }), "barcode.svg");
  }

  async function copySvg() {
    const svg = applySVG();
    if (!svg) return;
    await navigator.clipboard.writeText(svg);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Input */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Value</label>
        <input id="barcode-value" value={value} onChange={e => setValue(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Enter barcode data…" />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      {/* Format */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Format</label>
        <div className="flex flex-wrap gap-1.5">
          {FORMAT_META.map(f => (
            <button key={f.value} id={`fmt-${f.value}`} title={f.hint}
              onClick={() => setFormat(f.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${format === f.value ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {f.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{FORMAT_META.find(f => f.value === format)?.hint}</p>
      </div>

      {/* Presets */}
      <div className="flex gap-2 flex-wrap">
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => { setFormat(p.format); setValue(p.value); }}
            className="px-2.5 py-1 rounded-md border border-border/60 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
            {p.label}
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="rounded-lg border border-border/60 bg-secondary/10 p-6 flex items-center justify-center min-h-36">
        <svg ref={svgRef} id="barcode-preview" />
      </div>

      {/* Customise */}
      <div className="rounded-lg border border-border/60 bg-card px-5 py-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customise</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Background</label>
            <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
              className="h-8 w-full rounded-md border border-input cursor-pointer" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Bar color</label>
            <input type="color" value={lineColor} onChange={e => setLineColor(e.target.value)}
              className="h-8 w-full rounded-md border border-input cursor-pointer" />
          </div>
          <div className="col-span-2 space-y-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showText} onChange={e => setShowText(e.target.checked)} className="rounded" />
              <span className="text-xs text-muted-foreground">Show text below</span>
            </label>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground"><span>Bar width</span><span>{barWidth}px</span></div>
            <Slider min={1} max={4} step={1} value={[barWidth]} onValueChange={([v]) => setBarWidth(v)} />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground"><span>Height</span><span>{barHeight}px</span></div>
            <Slider min={40} max={200} step={10} value={[barHeight]} onValueChange={([v]) => setBarHeight(v)} />
          </div>
        </div>
      </div>

      {/* Download */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={downloadPng} id="barcode-png" className="gap-1.5">
          <Download className="h-4 w-4" />Download PNG
        </Button>
        <Button variant="outline" onClick={downloadSvg} id="barcode-svg" className="gap-1.5">
          <Download className="h-4 w-4" />Download SVG
        </Button>
        <Button variant="outline" onClick={copySvg} id="barcode-copy" className="gap-1.5">
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          Copy SVG
        </Button>
      </div>
    </div>
  );
}
