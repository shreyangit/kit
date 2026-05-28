"use client";

import * as React from "react";
import imageCompression from "browser-image-compression";
import { Download, RotateCcw, ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropZone, useFilePreview, formatSize } from "@/components/tool-shell/DropZone";
import { downloadBlob } from "@/lib/utils/download";
import { cn } from "@/lib/utils";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

type OutputFormat = "auto" | "image/jpeg" | "image/webp" | "image/png";

const FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
  { value: "auto", label: "Keep" },
  { value: "image/jpeg", label: "JPG" },
  { value: "image/webp", label: "WebP" },
  { value: "image/png", label: "PNG" },
];

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

interface Stats {
  originalSize: number;
  compressedSize: number;
  reductionPct: number;
  width: number;
  height: number;
}

export function ImageCompressorTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [compressed, setCompressed] = React.useState<File | null>(null);
  const [quality, setQuality] = React.useState(80); // % target quality
  const [format, setFormat] = React.useState<OutputFormat>("auto");
  const [processing, setProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const previewUrl = useFilePreview(file);
  const compressedUrl = useFilePreview(compressed);

  // Resolve the effective output MIME type
  const outputType = format === "auto" ? file?.type ?? "image/jpeg" : format;
  const isLossless = outputType === "image/png";

  // Keyboard shortcuts
  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleCompress(); }
      if (e.key === "Escape") handleReset();
      if ((e.metaKey || e.ctrlKey) && e.key === "s" && compressed) { e.preventDefault(); handleDownload(); }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  function handleReset() {
    setFile(null);
    setCompressed(null);
    setStats(null);
    setProgress(0);
    setError(null);
    setFormat("auto");
  }

  function handleSelect(f: File) {
    setFile(f);
    setCompressed(null);
    setStats(null);
    setError(null);
    setProgress(0);
  }

  async function handleCompress() {
    if (!file || processing) return;
    setProcessing(true);
    setProgress(0);
    setCompressed(null);
    setStats(null);
    setError(null);

    try {
      const result = await imageCompression(file, {
        // Map the slider directly to encoder quality for predictable results.
        initialQuality: quality / 100,
        // Don't silently downscale — a compressor should keep dimensions.
        alwaysKeepResolution: true,
        useWebWorker: true,
        fileType: outputType,
        onProgress: (p) => setProgress(p),
      });

      // Read final dimensions for display.
      const dims = await imageDimensions(result);
      const pct = Math.round((1 - result.size / file.size) * 100);
      setCompressed(result);
      setStats({
        originalSize: file.size,
        compressedSize: result.size,
        reductionPct: pct,
        width: dims.width,
        height: dims.height,
      });
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? `Compression failed: ${err.message}`
          : "Compression failed. Try a different image or format."
      );
    } finally {
      setProcessing(false);
    }
  }

  function handleDownload() {
    if (!compressed) return;
    const ext = EXT[outputType] ?? compressed.name.split(".").pop() ?? "jpg";
    const name = file?.name.replace(/\.[^.]+$/, `_compressed.${ext}`) ?? `compressed.${ext}`;
    downloadBlob(compressed, name);
  }

  const grew = stats !== null && stats.reductionPct <= 0;
  const reductionColor = grew
    ? "text-amber-500"
    : stats && stats.reductionPct >= 50
    ? "text-green-500"
    : stats && stats.reductionPct >= 20
    ? "text-yellow-500"
    : "text-muted-foreground";

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Shortcuts */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <kbd className="px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">⌘↵</kbd><span>Compress</span>
        <kbd className="px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">⌘S</kbd><span>Download</span>
        <kbd className="px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">esc</kbd><span>Reset</span>
      </div>

      {!file ? (
        <DropZone accept={ACCEPT} maxSizeMB={50} onFiles={([f]) => handleSelect(f)} />
      ) : (
        <div className="space-y-6">
          {/* Before / After preview */}
          <div className="grid grid-cols-2 gap-3">
            {/* Original */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Original</span>
                <span className="text-xs font-mono text-foreground">{formatSize(file.size)}</span>
              </div>
              <div className="aspect-video rounded-lg border border-border/60 bg-secondary/20 overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {previewUrl && <img src={previewUrl} alt="Original" className="max-h-full max-w-full object-contain" />}
              </div>
            </div>

            {/* Compressed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Compressed</span>
                {stats && (
                  <span className={cn("text-xs font-mono font-semibold", reductionColor)}>
                    {grew ? `+${Math.abs(stats.reductionPct)}%` : `−${stats.reductionPct}%`} · {formatSize(stats.compressedSize)}
                  </span>
                )}
              </div>
              <div className="aspect-video rounded-lg border border-border/60 bg-secondary/20 overflow-hidden flex items-center justify-center relative">
                {compressedUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={compressedUrl} alt="Compressed" className="max-h-full max-w-full object-contain" />
                ) : processing ? (
                  <div className="text-center space-y-2 px-4">
                    <div className="text-xs text-muted-foreground">Compressing…</div>
                    <div className="h-1 w-32 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-200"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">{progress}%</div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Output appears here</p>
                )}
              </div>
              {stats && (
                <p className="text-[10px] text-muted-foreground text-right font-mono">
                  {stats.width}×{stats.height}
                </p>
              )}
            </div>
          </div>

          {/* Larger-output warning */}
          {grew && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-px" />
              <span>
                The result is larger than the original — this image is already well-optimized
                {isLossless && " and PNG is lossless"}. Try a lower quality, or switch the output to WebP for the best savings.
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          {/* Controls */}
          <div className="rounded-lg border border-border/60 bg-card px-5 py-4 space-y-5">
            {/* Quality */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Tooltip>
                  <TooltipTrigger>
                    <span className="text-sm font-medium cursor-help">Quality</span>
                  </TooltipTrigger>
                  <TooltipContent>Higher = better quality, larger file. Lower = smaller file, some loss.</TooltipContent>
                </Tooltip>
                <span className="text-sm font-mono text-primary">{quality}%</span>
              </div>
              <Slider
                id="compress-quality"
                min={10}
                max={95}
                step={5}
                value={[quality]}
                onValueChange={([v]) => setQuality(v)}
                disabled={isLossless}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Smallest</span>
                <span>Highest quality</span>
              </div>
              {isLossless && (
                <p className="text-[10px] text-muted-foreground">
                  PNG is lossless, so quality has little effect. Switch to WebP or JPG for major size savings.
                </p>
              )}
            </div>

            {/* Output format */}
            <div className="space-y-2 border-t border-border/60 pt-4">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Output format
              </span>
              <div className="flex flex-wrap gap-2">
                {FORMAT_OPTIONS.map((opt) => {
                  const active = format === opt.value;
                  return (
                    <button
                      key={opt.value}
                      id={`compress-format-${opt.value.replace("image/", "") || "auto"}`}
                      onClick={() => { setFormat(opt.value); setCompressed(null); setStats(null); }}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              id="compress-btn"
              onClick={handleCompress}
              disabled={processing}
            >
              {processing ? (
                <><span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> Compressing…</>
              ) : (
                <><ArrowRight className="h-4 w-4" /> Compress</>
              )}
            </Button>

            {compressed && (
              <Button id="compress-download-btn" variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4" />
                Download
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              id="compress-reset-btn"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <span><RotateCcw className="h-4 w-4" /></span>
                </TooltipTrigger>
                <TooltipContent>Reset (Esc)</TooltipContent>
              </Tooltip>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Read intrinsic dimensions of an image blob.
function imageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 });
    };
    img.src = url;
  });
}
