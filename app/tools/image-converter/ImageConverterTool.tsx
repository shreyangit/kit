"use client";

import * as React from "react";
import { Download, RefreshCw, RotateCcw, X, AlertTriangle, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropZone, formatSize } from "@/components/tool-shell/DropZone";
import { downloadBlob } from "@/lib/utils/download";
import { cn } from "@/lib/utils";

const ACCEPT = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/bmp",
];

type Format = {
  mime: string;
  label: string;
  ext: string;
  lossy: boolean;
};

const FORMATS: Format[] = [
  { mime: "image/jpeg", label: "JPG", ext: "jpg", lossy: true },
  { mime: "image/png", label: "PNG", ext: "png", lossy: false },
  { mime: "image/webp", label: "WebP", ext: "webp", lossy: true },
  { mime: "image/avif", label: "AVIF", ext: "avif", lossy: true },
];

// Probe whether the browser can actually *encode* a given MIME type.
// canvas.toBlob silently falls back to PNG for unsupported types, so we
// compare the produced blob's type against what we asked for.
async function canEncode(mime: string): Promise<boolean> {
  try {
    const c = document.createElement("canvas");
    c.width = 2;
    c.height = 2;
    const blob = await new Promise<Blob | null>((res) => c.toBlob(res, mime, 0.5));
    return !!blob && blob.type === mime;
  } catch {
    return false;
  }
}

async function convertImage(
  file: File,
  targetMime: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;

      // Formats without alpha get a white matte instead of black.
      if (targetMime === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Conversion failed"));
        },
        targetMime,
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
    img.src = url;
  });
}

interface ConversionResult {
  blob: Blob;
  size: number;
  format: Format;
}

export function ImageConverterTool() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [targetFormat, setTargetFormat] = React.useState<Format>(FORMATS[1]); // PNG default
  const [quality, setQuality] = React.useState(92);
  const [results, setResults] = React.useState<Map<string, ConversionResult>>(new Map());
  const [processing, setProcessing] = React.useState(false);
  const [processedCount, setProcessedCount] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [zipping, setZipping] = React.useState(false);
  const [supported, setSupported] = React.useState<Set<string>>(
    () => new Set(["image/jpeg", "image/png", "image/webp"])
  );

  // Probe encoder support once on mount.
  React.useEffect(() => {
    let active = true;
    (async () => {
      const checks = await Promise.all(
        FORMATS.map(async (f) => [f.mime, await canEncode(f.mime)] as const)
      );
      if (!active) return;
      setSupported(new Set(checks.filter(([, ok]) => ok).map(([m]) => m)));
    })();
    return () => { active = false; };
  }, []);

  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleConvert(); }
      if (e.key === "Escape") handleReset();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  function handleReset() {
    setFiles([]);
    setResults(new Map());
    setProcessedCount(0);
    setError(null);
  }

  function selectFormat(fmt: Format) {
    if (!supported.has(fmt.mime)) return;
    setTargetFormat(fmt);
    setResults(new Map());
    setError(null);
  }

  async function handleConvert() {
    if (!files.length || processing) return;
    if (!supported.has(targetFormat.mime)) {
      setError(`${targetFormat.label} encoding isn't supported in this browser.`);
      return;
    }
    setProcessing(true);
    setError(null);
    setResults(new Map());
    setProcessedCount(0);
    const newResults = new Map<string, ConversionResult>();
    let failures = 0;

    for (const file of files) {
      try {
        const blob = await convertImage(file, targetFormat.mime, quality / 100);
        newResults.set(file.name, { blob, size: blob.size, format: targetFormat });
        setProcessedCount((n) => n + 1);
        setResults(new Map(newResults));
      } catch (err) {
        console.error(err);
        failures++;
      }
    }
    if (failures > 0) {
      setError(`${failures} file${failures > 1 ? "s" : ""} couldn't be converted.`);
    }
    setProcessing(false);
  }

  function outName(file: File, result: ConversionResult) {
    const baseName = file.name.replace(/\.[^.]+$/, "");
    return `${baseName}.${result.format.ext}`;
  }

  function handleDownload(file: File) {
    const result = results.get(file.name);
    if (!result) return;
    downloadBlob(result.blob, outName(file, result));
  }

  async function handleDownloadAll() {
    if (results.size === 0 || zipping) return;
    setZipping(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const used = new Map<string, number>();
      for (const file of files) {
        const result = results.get(file.name);
        if (!result) continue;
        let name = outName(file, result);
        // De-dupe identical output names.
        const count = used.get(name) ?? 0;
        if (count > 0) {
          name = name.replace(/(\.[^.]+)$/, `_${count}$1`);
        }
        used.set(outName(file, result), count + 1);
        zip.file(name, result.blob);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, `converted-${targetFormat.ext}.zip`);
    } catch (err) {
      console.error(err);
      setError("Could not build the ZIP. Download files individually instead.");
    } finally {
      setZipping(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Shortcuts */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <kbd className="px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">⌘↵</kbd><span>Convert</span>
        <kbd className="px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">esc</kbd><span>Reset</span>
      </div>

      {files.length === 0 ? (
        <DropZone
          accept={ACCEPT}
          maxSizeMB={50}
          multiple
          onFiles={setFiles}
          label="Drop images to convert"
          sublabel="JPG, PNG, WebP, AVIF, GIF, BMP · up to 50 MB each · multiple files OK"
        />
      ) : (
        <div className="space-y-5">
          {/* File list */}
          <div className="space-y-1.5">
            {files.map((file) => {
              const result = results.get(file.name);
              const sizeDiff = result ? result.size - file.size : null;
              return (
                <div
                  key={file.name}
                  className="flex items-center gap-3 rounded-md border border-border/60 bg-card px-4 py-2.5"
                >
                  <span className="text-xs font-mono text-muted-foreground truncate flex-1 min-w-0">
                    {file.name}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatSize(file.size)}
                  </span>
                  {result && (
                    <>
                      <span className="text-xs text-muted-foreground shrink-0">→</span>
                      <span className={cn("text-xs font-mono shrink-0", sizeDiff && sizeDiff < 0 ? "text-green-500" : "text-muted-foreground")}>
                        {formatSize(result.size)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs shrink-0"
                        onClick={() => handleDownload(file)}
                        id={`download-${file.name}`}
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        .{result.format.ext}
                      </Button>
                    </>
                  )}
                  <button
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setFiles((prev) => prev.filter((f) => f !== file))}
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Target format picker */}
          <div className="rounded-lg border border-border/60 bg-card px-5 py-4 space-y-4">
            <div className="space-y-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Convert to
              </span>
              <div className="flex flex-wrap gap-2">
                {FORMATS.map((fmt) => {
                  const sourceType = files[0]?.type;
                  const isSupported = supported.has(fmt.mime);
                  const btn = (
                    <button
                      key={fmt.mime}
                      id={`format-${fmt.ext}`}
                      disabled={!isSupported}
                      onClick={() => selectFormat(fmt)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-colors",
                        !isSupported
                          ? "bg-secondary/40 text-muted-foreground/50 cursor-not-allowed line-through"
                          : targetFormat.mime === fmt.mime
                          ? "bg-primary text-primary-foreground"
                          : fmt.mime === sourceType
                          ? "bg-secondary/50 text-muted-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      )}
                    >
                      {fmt.label}
                    </button>
                  );
                  return isSupported ? btn : (
                    <Tooltip key={fmt.mime}>
                      <TooltipTrigger asChild><span>{btn}</span></TooltipTrigger>
                      <TooltipContent>Not supported by this browser&apos;s encoder</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            {/* Quality (lossy formats only) */}
            {targetFormat.lossy && (
              <div className="space-y-2 border-t border-border/60 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quality</span>
                  <span className="text-xs font-mono text-primary">{quality}%</span>
                </div>
                <Slider
                  id="convert-quality"
                  min={10}
                  max={100}
                  step={1}
                  value={[quality]}
                  onValueChange={([v]) => { setQuality(v); setResults(new Map()); }}
                />
              </div>
            )}

            {targetFormat.mime === "image/jpeg" && (
              <p className="text-[10px] text-muted-foreground">
                Transparency will be filled with white (JPEG doesn&apos;t support alpha).
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-px" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 items-center">
            <Button id="convert-btn" onClick={handleConvert} disabled={processing}>
              {processing ? (
                <><span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Converting {processedCount}/{files.length}…</>
              ) : (
                <><RefreshCw className="h-4 w-4" />
                  Convert {files.length > 1 ? `${files.length} files` : "file"}</>
              )}
            </Button>

            {results.size > 1 && (
              <Button variant="outline" onClick={handleDownloadAll} disabled={zipping} id="convert-download-all">
                {zipping ? (
                  <><span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin" /> Zipping…</>
                ) : (
                  <><Archive className="h-4 w-4" /> Download all (.zip)</>
                )}
              </Button>
            )}

            <Button variant="ghost" size="icon" onClick={handleReset} id="convert-reset-btn">
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
