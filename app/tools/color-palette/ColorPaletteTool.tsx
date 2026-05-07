"use client";

import * as React from "react";
import { Copy, Check, RotateCcw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropZone, useFilePreview } from "@/components/tool-shell/DropZone";
import { downloadText } from "@/lib/utils/download";
import { cn } from "@/lib/utils";

const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"];

// ── Color utilities ────────────────────────────────────────────────────────

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rr, gg, bb] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
}

function contrastOnWhite(r: number, g: number, b: number): "dark" | "light" {
  const lum = relativeLuminance(r, g, b);
  return lum > 0.4 ? "dark" : "light";
}

// ── ColorthiefExtractor (runs in browser only) ─────────────────────────────

type RGB = [number, number, number];

async function extractPalette(file: File, count: number): Promise<RGB[]> {
  // colorthief exports the class as the module itself (no .default in its types)
  const ct = new (await import("colorthief") as unknown as { default: new () => { getPalette: (img: HTMLImageElement, count: number, quality: number) => RGB[] } }).default();
  const img = new Image();
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const palette: RGB[] = ct.getPalette(img, count, 5) as RGB[];
        URL.revokeObjectURL(url);
        resolve(palette);
      } catch (e) { URL.revokeObjectURL(url); reject(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Load failed")); };
    img.src = url;
  });
}

// ── Component ─────────────────────────────────────────────────────────────

interface Swatch {
  rgb: RGB;
  hex: string;
  hsl: [number, number, number];
}

function CopyButton({ text, id }: { text: string; id: string }) {
  const [copied, setCopied] = React.useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      id={id}
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/10"
      aria-label={`Copy ${text}`}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

export function ColorPaletteTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [count, setCount] = React.useState(8);
  const [swatches, setSwatches] = React.useState<Swatch[]>([]);
  const [processing, setProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const previewUrl = useFilePreview(file);

  React.useEffect(() => {
    if (!file) return;
    setError(null);
    setSwatches([]);
    setProcessing(true);
    extractPalette(file, count)
      .then((palette) => {
        const result: Swatch[] = palette.map((rgb) => ({
          rgb,
          hex: rgbToHex(...rgb),
          hsl: rgbToHsl(...rgb),
        }));
        setSwatches(result);
      })
      .catch((e) => setError(e.message))
      .finally(() => setProcessing(false));
  }, [file, count]);

  function handleReset() {
    setFile(null);
    setSwatches([]);
    setError(null);
  }

  function buildCssVars(format: "hex" | "rgb" | "hsl"): string {
    return (
      ":root {\n" +
      swatches
        .map((s, i) => {
          const val =
            format === "hex"
              ? s.hex
              : format === "rgb"
              ? `rgb(${s.rgb.join(", ")})`
              : `hsl(${s.hsl[0]}, ${s.hsl[1]}%, ${s.hsl[2]}%)`;
          return `  --color-${i + 1}: ${val};`;
        })
        .join("\n") +
      "\n}"
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {!file ? (
        <DropZone
          accept={ACCEPT}
          maxSizeMB={30}
          onFiles={([f]) => setFile(f)}
          label="Drop an image to extract its palette"
          sublabel="JPG, PNG, WebP, GIF, BMP · max 30 MB"
        />
      ) : (
        <div className="space-y-5 animate-fade-in">
          {/* Image + controls row */}
          <div className="flex gap-4 items-start">
            <div className="shrink-0 rounded-lg overflow-hidden border border-border/60 h-32 w-32 bg-secondary/20 flex items-center justify-center">
              {previewUrl && (
                <img src={previewUrl} alt="Source" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Colors to extract</span>
                <span className="text-sm font-mono text-primary">{count}</span>
              </div>
              <Slider
                id="palette-count"
                min={2}
                max={16}
                step={1}
                value={[count]}
                onValueChange={([v]) => setCount(v)}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>2</span><span>16</span>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          {/* Processing */}
          {processing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-block h-4 w-4 rounded-full border-2 border-border border-t-primary animate-spin" />
              Extracting palette…
            </div>
          )}

          {/* Swatches */}
          {swatches.length > 0 && (
            <div className="space-y-5">
              {/* Large swatches strip */}
              <div className="flex rounded-xl overflow-hidden h-20 shadow-sm">
                {swatches.map((s, i) => (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <button
                        id={`swatch-${i}`}
                        style={{ backgroundColor: s.hex, flex: 1 }}
                        aria-label={s.hex}
                        onClick={() => navigator.clipboard.writeText(s.hex)}
                        className="transition-opacity hover:opacity-90"
                      />
                    </TooltipTrigger>
                    <TooltipContent>{s.hex} — click to copy</TooltipContent>
                  </Tooltip>
                ))}
              </div>

              {/* Swatch list with values */}
              <Tabs defaultValue="hex" id="palette-tabs">
                <div className="flex items-center justify-between mb-3">
                  <TabsList>
                    <TabsTrigger value="hex" id="palette-tab-hex">HEX</TabsTrigger>
                    <TabsTrigger value="rgb" id="palette-tab-rgb">RGB</TabsTrigger>
                    <TabsTrigger value="hsl" id="palette-tab-hsl">HSL</TabsTrigger>
                  </TabsList>
                </div>

                {(["hex", "rgb", "hsl"] as const).map((fmt) => (
                  <TabsContent key={fmt} value={fmt}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {swatches.map((s, i) => {
                        const textColor = contrastOnWhite(...s.rgb);
                        const val =
                          fmt === "hex"
                            ? s.hex
                            : fmt === "rgb"
                            ? `rgb(${s.rgb.join(", ")})`
                            : `hsl(${s.hsl[0]}, ${s.hsl[1]}%, ${s.hsl[2]}%)`;
                        return (
                          <div
                            key={i}
                            className="group flex items-center gap-3 rounded-md border border-border/60 bg-card px-3 py-2"
                          >
                            <div
                              className="h-7 w-7 rounded-md shrink-0 shadow-sm"
                              style={{ backgroundColor: s.hex }}
                            />
                            <span className="flex-1 text-xs font-mono text-foreground truncate">
                              {val}
                            </span>
                            <CopyButton text={val} id={`copy-${fmt}-${i}`} />
                          </div>
                        );
                      })}
                    </div>

                    {/* CSS Variables snippet */}
                    <div className="mt-4 rounded-lg border border-border/60 bg-secondary/30 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          CSS Variables
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs gap-1"
                            onClick={() => navigator.clipboard.writeText(buildCssVars(fmt))}
                            id={`copy-css-${fmt}`}
                          >
                            <Copy className="h-3 w-3" />
                            Copy
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs gap-1"
                            onClick={() => downloadText(buildCssVars(fmt), "palette.css", "text/css")}
                            id={`download-css-${fmt}`}
                          >
                            <Download className="h-3 w-3" />
                            .css
                          </Button>
                        </div>
                      </div>
                      <pre className="text-[10px] font-mono text-muted-foreground leading-relaxed overflow-x-auto">
                        {buildCssVars(fmt)}
                      </pre>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}

          {/* Reset */}
          <Button variant="ghost" size="sm" onClick={handleReset} id="palette-reset-btn" className="text-xs gap-1 text-muted-foreground">
            <RotateCcw className="h-3 w-3" />
            Change image
          </Button>
        </div>
      )}
    </div>
  );
}
