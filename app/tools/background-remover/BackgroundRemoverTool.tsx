"use client";

import * as React from "react";
import { Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropZone, useFilePreview, formatSize } from "@/components/tool-shell/DropZone";
import { downloadBlob } from "@/lib/utils/download";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

export function BackgroundRemoverTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [resultBlob, setResultBlob] = React.useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = React.useState<string | null>(null);
  const [processing, setProcessing] = React.useState(false);
  const [modelProgress, setModelProgress] = React.useState<string>("");
  const [overallProgress, setOverallProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [sliderPos, setSliderPos] = React.useState(50); // before/after slider position

  const originalUrl = useFilePreview(file);

  React.useEffect(() => {
    return () => { if (resultUrl) URL.revokeObjectURL(resultUrl); };
  }, [resultUrl]);

  async function handleRemove() {
    if (!file || processing) return;
    setProcessing(true);
    setError(null);
    setResultBlob(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setOverallProgress(0);
    setModelProgress("Loading model…");

    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(file, {
        progress: (key: string, current: number, total: number) => {
          if (total > 0) {
            const pct = Math.round((current / total) * 100);
            setOverallProgress(pct);
            if (key.includes("fetch")) setModelProgress(`Downloading model… ${pct}%`);
            else if (key.includes("infer")) setModelProgress(`Processing… ${pct}%`);
            else setModelProgress(`${key} ${pct}%`);
          }
        },
      });
      const url = URL.createObjectURL(blob);
      setResultBlob(blob);
      setResultUrl(url);
      setModelProgress("");
    } catch (e) {
      setError(`Failed: ${(e as Error).message}`);
    } finally {
      setProcessing(false);
      setOverallProgress(0);
    }
  }

  function handleDownload() {
    if (!resultBlob || !file) return;
    const name = file.name.replace(/\.[^.]+$/, "_nobg.png");
    downloadBlob(resultBlob, name);
  }

  function handleReset() {
    setFile(null);
    setResultBlob(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setError(null);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-600 dark:text-amber-400">
        <strong>First run:</strong> Downloads a ~40 MB AI model (cached after). Processing runs entirely in your browser.
      </div>

      {!file ? (
        <DropZone
          accept={ACCEPT}
          maxSizeMB={20}
          onFiles={([f]) => setFile(f)}
          label="Drop image to remove background"
          sublabel="JPG, PNG, WebP · max 20 MB · best with clear subject"
        />
      ) : (
        <div className="space-y-5">
          {/* Before / After comparison */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Original</span>
              {resultUrl && <span>Result (transparent)</span>}
            </div>

            {resultUrl ? (
              // Slider comparison
              <div className="relative rounded-lg overflow-hidden border border-border/60 select-none" style={{ height: 400 }}>
                {/* Checkerboard background for transparency */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                    backgroundSize: "16px 16px",
                    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
                  }}
                />
                {/* Result (right) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultUrl} alt="Background removed" className="absolute inset-0 w-full h-full object-contain" />
                {/* Original (left, clipped) */}
                <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={originalUrl ?? ""} alt="Original" className="absolute inset-0 w-full h-full object-contain" />
                </div>
                {/* Divider line */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md pointer-events-none" style={{ left: `${sliderPos}%` }}>
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-white shadow-lg flex items-center justify-center text-[10px] text-slate-600 font-mono cursor-ew-resize pointer-events-auto select-none"
                    onMouseDown={(e) => {
                      const container = e.currentTarget.closest(".relative") as HTMLElement;
                      const move = (ev: MouseEvent) => {
                        const rect = container.getBoundingClientRect();
                        const pct = Math.min(100, Math.max(0, ((ev.clientX - rect.left) / rect.width) * 100));
                        setSliderPos(pct);
                      };
                      const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
                      window.addEventListener("mousemove", move);
                      window.addEventListener("mouseup", up);
                    }}
                  >⟺</div>
                </div>
                {/* Labels */}
                <div className="absolute top-2 left-2 text-[10px] bg-black/50 text-white rounded px-1.5 py-0.5">Before</div>
                <div className="absolute top-2 right-2 text-[10px] bg-black/50 text-white rounded px-1.5 py-0.5">After</div>
              </div>
            ) : (
              <div className="rounded-lg border border-border/60 overflow-hidden" style={{ height: 300 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {originalUrl && <img src={originalUrl} alt="Original" className="w-full h-full object-contain bg-secondary/20" />}
              </div>
            )}
          </div>

          {/* File info row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="truncate font-mono">{file.name}</span>
            <span className="shrink-0">{formatSize(file.size)}</span>
            {resultBlob && <span className="shrink-0 text-green-500">→ {formatSize(resultBlob.size)} PNG</span>}
          </div>

          {/* Progress */}
          {processing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-block h-4 w-4 rounded-full border-2 border-border border-t-primary animate-spin shrink-0" />
                <span className="text-xs">{modelProgress}</span>
              </div>
              {overallProgress > 0 && (
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-300 rounded-full" style={{ width: `${overallProgress}%` }} />
                </div>
              )}
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {!resultBlob ? (
              <Button onClick={handleRemove} disabled={processing} id="bgremove-btn">
                {processing ? "Processing…" : "Remove Background"}
              </Button>
            ) : (
              <>
                <Button onClick={handleRemove} disabled={processing} variant="outline" id="bgremove-retry-btn">
                  {processing ? "Processing…" : "Run Again"}
                </Button>
                <Button onClick={handleDownload} id="bgremove-download-btn">
                  <Download className="h-4 w-4" />Download PNG
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={handleReset} id="bgremove-reset-btn" aria-label="Reset">
              <Tooltip>
                <TooltipTrigger asChild><span><RotateCcw className="h-4 w-4" /></span></TooltipTrigger>
                <TooltipContent>Reset</TooltipContent>
              </Tooltip>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
