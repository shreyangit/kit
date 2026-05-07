"use client";

import * as React from "react";
import { Download, RefreshCw, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropZone, useFilePreview, formatSize } from "@/components/tool-shell/DropZone";
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
};

const FORMATS: Format[] = [
  { mime: "image/jpeg", label: "JPG", ext: "jpg" },
  { mime: "image/png", label: "PNG", ext: "png" },
  { mime: "image/webp", label: "WebP", ext: "webp" },
  { mime: "image/avif", label: "AVIF", ext: "avif" },
  { mime: "image/bmp", label: "BMP", ext: "bmp" },
];

async function convertImage(file: File, targetMime: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;

      // For formats that don't support transparency, fill white
      if (targetMime === "image/jpeg" || targetMime === "image/bmp") {
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
        0.92
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
  const [results, setResults] = React.useState<Map<string, ConversionResult>>(new Map());
  const [processing, setProcessing] = React.useState(false);
  const [processedCount, setProcessedCount] = React.useState(0);

  const previewUrl = useFilePreview(files[0] ?? null);

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
  }

  async function handleConvert() {
    if (!files.length || processing) return;
    setProcessing(true);
    setResults(new Map());
    setProcessedCount(0);
    const newResults = new Map<string, ConversionResult>();

    for (const file of files) {
      try {
        const blob = await convertImage(file, targetFormat.mime);
        newResults.set(file.name, { blob, size: blob.size, format: targetFormat });
        setProcessedCount((n) => n + 1);
        setResults(new Map(newResults));
      } catch (err) {
        console.error(err);
      }
    }
    setProcessing(false);
  }

  function handleDownload(file: File) {
    const result = results.get(file.name);
    if (!result) return;
    const baseName = file.name.replace(/\.[^.]+$/, "");
    downloadBlob(result.blob, `${baseName}.${result.format.ext}`);
  }

  function handleDownloadAll() {
    files.forEach((f) => handleDownload(f));
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
          <div className="rounded-lg border border-border/60 bg-card px-5 py-4 space-y-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Convert to
            </span>
            <div className="flex flex-wrap gap-2">
              {FORMATS.map((fmt) => {
                // Don't show same format as first file
                const sourceType = files[0]?.type;
                return (
                  <button
                    key={fmt.mime}
                    id={`format-${fmt.ext}`}
                    onClick={() => { setTargetFormat(fmt); setResults(new Map()); }}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-colors",
                      targetFormat.mime === fmt.mime
                        ? "bg-primary text-primary-foreground"
                        : fmt.mime === sourceType
                        ? "bg-secondary/50 text-muted-foreground cursor-default"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    {fmt.label}
                  </button>
                );
              })}
            </div>
            {(targetFormat.mime === "image/jpeg" || targetFormat.mime === "image/bmp") && (
              <p className="text-[10px] text-muted-foreground">
                Transparency will be filled with white (JPEG and BMP don't support alpha).
              </p>
            )}
          </div>

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
              <Button variant="outline" onClick={handleDownloadAll} id="convert-download-all">
                <Download className="h-4 w-4" />
                Download all
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
