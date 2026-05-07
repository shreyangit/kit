"use client";

import * as React from "react";
import imageCompression from "browser-image-compression";
import { Download, RotateCcw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropZone, useFilePreview, formatSize } from "@/components/tool-shell/DropZone";
import { downloadBlob } from "@/lib/utils/download";
import { cn } from "@/lib/utils";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

interface Stats {
  originalSize: number;
  compressedSize: number;
  reductionPct: number;
}

export function ImageCompressorTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [compressed, setCompressed] = React.useState<File | null>(null);
  const [quality, setQuality] = React.useState(80); // % target quality
  const [processing, setProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [stats, setStats] = React.useState<Stats | null>(null);

  const previewUrl = useFilePreview(file);
  const compressedUrl = useFilePreview(compressed);

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
  }

  async function handleCompress() {
    if (!file || processing) return;
    setProcessing(true);
    setProgress(0);
    setCompressed(null);
    setStats(null);

    try {
      const result = await imageCompression(file, {
        maxSizeMB: (quality / 100) * (file.size / (1024 * 1024)),
        maxWidthOrHeight: 4096,
        useWebWorker: true,
        fileType: file.type as "image/jpeg" | "image/png" | "image/webp",
        onProgress: (p) => setProgress(p),
      });

      const pct = Math.round((1 - result.size / file.size) * 100);
      setCompressed(result);
      setStats({ originalSize: file.size, compressedSize: result.size, reductionPct: pct });
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  }

  function handleDownload() {
    if (!compressed) return;
    const ext = compressed.name.split(".").pop() ?? "jpg";
    const name = file?.name.replace(/\.[^.]+$/, `_compressed.${ext}`) ?? `compressed.${ext}`;
    downloadBlob(compressed, name);
  }

  const reductionColor =
    stats && stats.reductionPct >= 50
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
        <DropZone accept={ACCEPT} maxSizeMB={50} onFiles={([f]) => setFile(f)} />
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
                    −{stats.reductionPct}% · {formatSize(stats.compressedSize)}
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
            </div>
          </div>

          {/* Quality control */}
          <div className="rounded-lg border border-border/60 bg-card px-5 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <Tooltip>
                <TooltipTrigger>
                  <span className="text-sm font-medium cursor-help">Target quality</span>
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
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Smallest</span>
              <span>Highest quality</span>
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
