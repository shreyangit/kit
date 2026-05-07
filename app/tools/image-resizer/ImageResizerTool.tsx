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

const SOCIAL_PRESETS = [
  { label: "1:1", w: 1080, h: 1080, hint: "Instagram square" },
  { label: "16:9", w: 1920, h: 1080, hint: "Widescreen / YouTube" },
  { label: "9:16", w: 1080, h: 1920, hint: "Stories / Reels" },
  { label: "4:3", w: 1200, h: 900, hint: "Classic landscape" },
  { label: "Twitter", w: 1500, h: 500, hint: "Twitter/X header" },
  { label: "LinkedIn", w: 1584, h: 396, hint: "LinkedIn banner" },
  { label: "OG Image", w: 1200, h: 630, hint: "Open Graph / meta image" },
];

async function resizeCanvas(
  file: File,
  targetW: number,
  targetH: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, targetW, targetH);
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
  const [outputBlob, setOutputBlob] = React.useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = React.useState<string | null>(null);
  const [processing, setProcessing] = React.useState(false);

  const previewUrl = useFilePreview(file);

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
    setOutputBlob(null);
    setOutputUrl(null);
  }, [file]);

  // Cleanup output URL
  React.useEffect(() => {
    return () => { if (outputUrl) URL.revokeObjectURL(outputUrl); };
  }, [outputUrl]);

  function handleReset() {
    setFile(null);
    setOutputBlob(null);
    setOutputUrl(null);
    setPercent("100");
    setLocked(true);
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
    const w = parseInt(width);
    const h = parseInt(height);
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return;
    setProcessing(true);
    try {
      const blob = await resizeCanvas(file, w, h);
      if (outputUrl) URL.revokeObjectURL(outputUrl);
      const url = URL.createObjectURL(blob);
      setOutputBlob(blob);
      setOutputUrl(url);
    } catch (err) { console.error(err); }
    finally { setProcessing(false); }
  }

  function applyPreset(w: number, h: number) {
    setWidth(String(w));
    setHeight(String(h));
    setLocked(false);
    setOutputBlob(null);
  }

  function applyPercent() {
    const pct = parseFloat(percent);
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
        <kbd className="px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">esc</kbd><span>Reset</span>
      </div>

      {!file ? (
        <DropZone accept={ACCEPT} maxSizeMB={50} onFiles={([f]) => setFile(f)} />
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
          <div className="rounded-lg border border-border/60 bg-card px-5 py-4">
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

              {/* Percent tab */}
              <TabsContent value="percent">
                <div className="flex items-end gap-3">
                  <div className="space-y-1.5 w-36">
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Percentage</label>
                    <Input
                      id="resize-percent"
                      type="number"
                      value={percent}
                      onChange={(e) => setPercent(e.target.value)}
                      min={1}
                      max={400}
                      className="font-mono"
                    />
                  </div>
                  <Button variant="outline" onClick={() => { applyPercent(); }} id="resize-apply-pct">
                    Apply
                  </Button>
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
