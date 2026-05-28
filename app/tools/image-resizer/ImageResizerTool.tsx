"use client";

import * as React from "react";
import { Download, RotateCcw, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropZone, useFilePreview, formatSize } from "@/components/tool-shell/DropZone";
import { downloadBlob } from "@/lib/utils/download";
import { cn } from "@/lib/utils";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

type Fit = "stretch" | "cover" | "contain";

const FITS: { value: Fit; label: string; hint: string }[] = [
  { value: "stretch", label: "Stretch", hint: "Force exact size — may distort the image" },
  { value: "cover", label: "Cover", hint: "Fill the frame and crop the overflow — no distortion" },
  { value: "contain", label: "Contain", hint: "Fit the whole image and pad the rest — no distortion" },
];

const SOCIAL_PRESETS = [
  { label: "1:1", w: 1080, h: 1080, hint: "Instagram square" },
  { label: "16:9", w: 1920, h: 1080, hint: "Widescreen / YouTube" },
  { label: "9:16", w: 1080, h: 1920, hint: "Stories / Reels" },
  { label: "4:3", w: 1200, h: 900, hint: "Classic landscape" },
  { label: "Twitter", w: 1500, h: 500, hint: "Twitter/X header" },
  { label: "LinkedIn", w: 1584, h: 396, hint: "LinkedIn banner" },
  { label: "OG Image", w: 1200, h: 630, hint: "Open Graph / meta image" },
];

// Progressive halving for sharp downscales — drawing straight to a tiny canvas
// aliases badly, so we step the image down by no more than 2x per pass.
function stepDownscale(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  destW: number,
  destH: number
): CanvasImageSource {
  let cw = srcW;
  let ch = srcH;
  let current = source;
  while (cw > destW * 2 || ch > destH * 2) {
    cw = Math.max(destW, Math.floor(cw / 2));
    ch = Math.max(destH, Math.floor(ch / 2));
    const tmp = document.createElement("canvas");
    tmp.width = cw;
    tmp.height = ch;
    const tctx = tmp.getContext("2d")!;
    tctx.imageSmoothingEnabled = true;
    tctx.imageSmoothingQuality = "high";
    tctx.drawImage(current, 0, 0, cw, ch);
    current = tmp;
  }
  return current;
}

async function resizeCanvas(
  file: File,
  targetW: number,
  targetH: number,
  fit: Fit,
  fillColor: string,
  transparent: boolean
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Geometry of where the source lands on the target canvas.
      let dx = 0, dy = 0, dw = targetW, dh = targetH;
      if (fit === "cover") {
        const scale = Math.max(targetW / iw, targetH / ih);
        dw = iw * scale; dh = ih * scale;
        dx = (targetW - dw) / 2; dy = (targetH - dh) / 2;
      } else if (fit === "contain") {
        const scale = Math.min(targetW / iw, targetH / ih);
        dw = iw * scale; dh = ih * scale;
        dx = (targetW - dw) / 2; dy = (targetH - dh) / 2;
        if (!(transparent && file.type !== "image/jpeg")) {
          ctx.fillStyle = file.type === "image/jpeg" ? fillColor || "#ffffff" : fillColor;
          ctx.fillRect(0, 0, targetW, targetH);
        }
      } else if (file.type === "image/jpeg") {
        // Stretch onto JPEG — no alpha, so guarantee an opaque base.
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetW, targetH);
      }

      // Pre-shrink large sources for crisp results, then composite.
      const src = stepDownscale(img, iw, ih, Math.round(dw), Math.round(dh));
      ctx.drawImage(src, dx, dy, dw, dh);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (b) => { if (b) resolve(b); else reject(new Error("Resize failed")); },
        file.type,
        0.92
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Load failed")); };
    img.src = url;
  });
}

export function ImageResizerTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [origW, setOrigW] = React.useState(0);
  const [origH, setOrigH] = React.useState(0);
  const [width, setWidth] = React.useState("");
  const [height, setHeight] = React.useState("");
  const [percent, setPercent] = React.useState("100");
  const [locked, setLocked] = React.useState(true);
  const [fit, setFit] = React.useState<Fit>("stretch");
  const [fillColor, setFillColor] = React.useState("#ffffff");
  const [transparent, setTransparent] = React.useState(true);
  const [outputBlob, setOutputBlob] = React.useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = React.useState<string | null>(null);
  const [processing, setProcessing] = React.useState(false);

  const previewUrl = useFilePreview(file);

  const supportsAlpha = file ? file.type !== "image/jpeg" : true;
  const w = parseInt(width);
  const h = parseInt(height);
  // Does the target aspect ratio differ from the source? Then fit matters.
  const ratioMismatch =
    origW > 0 && origH > 0 && !isNaN(w) && !isNaN(h) && w > 0 && h > 0 &&
    Math.abs(w / h - origW / origH) > 0.01;

  // When file loads, get its dimensions
  React.useEffect(() => {
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      setOrigW(img.naturalWidth);
      setOrigH(img.naturalHeight);
      setWidth(String(img.naturalWidth));
      setHeight(String(img.naturalHeight));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [file]);

  // Cleanup output URL
  React.useEffect(() => {
    return () => { if (outputUrl) URL.revokeObjectURL(outputUrl); };
  }, [outputUrl]);

  // Keyboard shortcuts (advertised in the hint bar)
  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleResize(); }
      if (e.key === "Escape") handleReset();
      if ((e.metaKey || e.ctrlKey) && e.key === "s" && outputBlob) { e.preventDefault(); handleDownload(); }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  function handleSelect(f: File) {
    setFile(f);
    setOutputBlob(null);
    setOutputUrl(null);
  }

  function handleReset() {
    setFile(null);
    setOutputBlob(null);
    setOutputUrl(null);
    setPercent("100");
    setLocked(true);
    setFit("stretch");
  }

  // Pixel tab: sync height when width changes (if locked)
  function onWidthChange(v: string) {
    setWidth(v);
    if (locked && origW && origH) {
      const n = parseInt(v);
      if (!isNaN(n)) setHeight(String(Math.round((n * origH) / origW)));
    }
  }
  function onHeightChange(v: string) {
    setHeight(v);
    if (locked && origW && origH) {
      const n = parseInt(v);
      if (!isNaN(n)) setWidth(String(Math.round((n * origW) / origH)));
    }
  }

  async function handleResize() {
    if (!file || processing) return;
    const tw = parseInt(width);
    const th = parseInt(height);
    if (isNaN(tw) || isNaN(th) || tw <= 0 || th <= 0) return;
    setProcessing(true);
    try {
      const blob = await resizeCanvas(file, tw, th, fit, fillColor, transparent && supportsAlpha);
      if (outputUrl) URL.revokeObjectURL(outputUrl);
      const url = URL.createObjectURL(blob);
      setOutputBlob(blob);
      setOutputUrl(url);
    } catch (err) { console.error(err); }
    finally { setProcessing(false); }
  }

  function applyPreset(pw: number, ph: number) {
    setWidth(String(pw));
    setHeight(String(ph));
    setLocked(false);
    setOutputBlob(null);
    // Presets usually change aspect ratio — default to non-distorting Cover.
    if (origW && origH && Math.abs(pw / ph - origW / origH) > 0.01) {
      setFit((prev) => (prev === "stretch" ? "cover" : prev));
    }
  }

  function applyPercent(pctStr: string) {
    const pct = parseFloat(pctStr);
    if (isNaN(pct) || pct <= 0 || !origW || !origH) return;
    setWidth(String(Math.round(origW * pct / 100)));
    setHeight(String(Math.round(origH * pct / 100)));
  }

  function handleDownload() {
    if (!outputBlob || !file) return;
    const ext = file.name.split(".").pop() ?? "png";
    downloadBlob(outputBlob, file.name.replace(/\.[^.]+$/, `_${width}x${height}.${ext}`));
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Shortcuts */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <kbd className="px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">⌘↵</kbd><span>Resize</span>
        <kbd className="px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">⌘S</kbd><span>Download</span>
        <kbd className="px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">esc</kbd><span>Reset</span>
      </div>

      {!file ? (
        <DropZone accept={ACCEPT} maxSizeMB={50} onFiles={([f]) => handleSelect(f)} />
      ) : (
        <div className="space-y-5">
          {/* Preview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Original</span>
                <span className="text-xs font-mono text-muted-foreground">{origW}×{origH}</span>
              </div>
              <div className="aspect-video rounded-lg border border-border/60 bg-secondary/20 overflow-hidden flex items-center justify-center">
                {previewUrl && <img src={previewUrl} alt="Original" className="max-h-full max-w-full object-contain" />}
              </div>
              <p className="text-[10px] text-muted-foreground text-right">{formatSize(file.size)}</p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Result</span>
                {outputBlob && (
                  <span className="text-xs font-mono text-primary">{width}×{height} · {formatSize(outputBlob.size)}</span>
                )}
              </div>
              <div className="aspect-video rounded-lg border border-border/60 bg-secondary/20 overflow-hidden flex items-center justify-center">
                {outputUrl ? (
                  <img src={outputUrl} alt="Resized" className="max-h-full max-w-full object-contain" />
                ) : (
                  <p className="text-xs text-muted-foreground">Output appears here</p>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="rounded-lg border border-border/60 bg-card px-5 py-4 space-y-4">
            <Tabs defaultValue="pixels" id="resize-tabs">
              <TabsList className="mb-4">
                <TabsTrigger value="pixels" id="resize-tab-pixels">Pixels</TabsTrigger>
                <TabsTrigger value="percent" id="resize-tab-percent">Percent</TabsTrigger>
                <TabsTrigger value="presets" id="resize-tab-presets">Presets</TabsTrigger>
              </TabsList>

              {/* Pixels tab */}
              <TabsContent value="pixels">
                <div className="flex items-center gap-3">
                  <div className="space-y-1.5 flex-1">
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Width</label>
                    <Input
                      id="resize-width"
                      type="number"
                      value={width}
                      onChange={(e) => onWidthChange(e.target.value)}
                      min={1}
                      max={8000}
                      className="font-mono"
                    />
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setLocked(!locked)}
                        className="mt-5 flex h-8 w-8 items-center justify-center rounded-md border border-border hover:border-primary/40 transition-colors"
                        id="resize-lock-btn"
                        aria-label={locked ? "Unlock aspect ratio" : "Lock aspect ratio"}
                      >
                        {locked ? (
                          <Lock className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Unlock className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{locked ? "Aspect ratio locked" : "Aspect ratio unlocked"}</TooltipContent>
                  </Tooltip>
                  <div className="space-y-1.5 flex-1">
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Height</label>
                    <Input
                      id="resize-height"
                      type="number"
                      value={height}
                      onChange={(e) => onHeightChange(e.target.value)}
                      min={1}
                      max={8000}
                      className="font-mono"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="percent">
                <div className="flex items-end gap-3">
                  <div className="space-y-1.5 w-36">
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Percentage</label>
                    <Input
                      id="resize-percent"
                      type="number"
                      value={percent}
                      onChange={(e) => { setPercent(e.target.value); applyPercent(e.target.value); }}
                      min={1}
                      max={400}
                      className="font-mono"
                    />
                  </div>
                  {origW && origH && percent && (
                    <p className="text-xs text-muted-foreground mb-1">
                      → {Math.round(origW * parseFloat(percent || "0") / 100)}
                      × {Math.round(origH * parseFloat(percent || "0") / 100)} px
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Presets tab */}
              <TabsContent value="presets">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SOCIAL_PRESETS.map((p) => (
                    <Tooltip key={p.label}>
                      <TooltipTrigger asChild>
                        <button
                          id={`preset-${p.label.replace(/\s/g, "-").toLowerCase()}`}
                          onClick={() => applyPreset(p.w, p.h)}
                          className="flex flex-col items-start gap-0.5 rounded-md border border-border/60 px-3 py-2.5 text-left hover:border-primary/40 transition-colors"
                        >
                          <span className="text-xs font-semibold text-foreground">{p.label}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{p.w}×{p.h}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{p.hint}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Fit mode — only meaningful when the aspect ratio changes */}
            <div className={cn("space-y-2 border-t border-border/60 pt-4", !ratioMismatch && "opacity-60")}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Fit</span>
                {!ratioMismatch && (
                  <span className="text-[10px] text-muted-foreground">Aspect ratio matches — fit has no effect</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {FITS.map((f) => (
                  <Tooltip key={f.value}>
                    <TooltipTrigger asChild>
                      <button
                        id={`resize-fit-${f.value}`}
                        onClick={() => { setFit(f.value); setOutputBlob(null); }}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                          fit === f.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        )}
                      >
                        {f.label}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{f.hint}</TooltipContent>
                  </Tooltip>
                ))}
              </div>

              {/* Padding color for Contain */}
              {fit === "contain" && (
                <div className="flex items-center gap-3 pt-1">
                  {supportsAlpha && (
                    <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={transparent}
                        onChange={(e) => { setTransparent(e.target.checked); setOutputBlob(null); }}
                        className="rounded"
                      />
                      Transparent
                    </label>
                  )}
                  {!(transparent && supportsAlpha) && (
                    <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      Padding
                      <input
                        type="color"
                        value={fillColor}
                        onChange={(e) => { setFillColor(e.target.value); setOutputBlob(null); }}
                        className="h-7 w-9 rounded border border-input cursor-pointer bg-background p-0.5"
                      />
                    </label>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button id="resize-btn" onClick={handleResize} disabled={processing || !width || !height}>
              {processing ? (
                <><span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> Resizing…</>
              ) : "Resize"}
            </Button>
            {outputBlob && (
              <Button variant="outline" onClick={handleDownload} id="resize-download-btn">
                <Download className="h-4 w-4" />
                Download
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleReset} id="resize-reset-btn">
              <Tooltip>
                <TooltipTrigger asChild><span><RotateCcw className="h-4 w-4" /></span></TooltipTrigger>
                <TooltipContent>Reset (Esc)</TooltipContent>
              </Tooltip>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
