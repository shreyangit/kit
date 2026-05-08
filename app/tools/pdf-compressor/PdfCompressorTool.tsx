"use client";

import * as React from "react";
import { Download, RotateCcw, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatSize } from "@/components/tool-shell/DropZone";

export function PdfCompressorTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [quality, setQuality] = React.useState(75);
  const [scale, setScale] = React.useState(150); // DPI for rasterisation
  const [processing, setProcessing] = React.useState(false);
  const [resultBlob, setResultBlob] = React.useState<Blob | null>(null);
  const [resultPages, setResultPages] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function compress() {
    if (!file) return;
    setProcessing(true); setError(null); setProgress(0);
    try {
      const [{ getDocument, GlobalWorkerOptions }, { PDFDocument }] = await Promise.all([
        import("pdfjs-dist"),
        import("pdf-lib"),
      ]);
      GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

      const srcBuf = await file.arrayBuffer();
      const pdfDoc = await getDocument({ data: srcBuf }).promise;
      const outPdf = await PDFDocument.create();
      const totalPages = pdfDoc.numPages;
      setResultPages(totalPages);

      for (let i = 1; i <= totalPages; i++) {
        setProgress(Math.round((i / totalPages) * 90));
        const page = await pdfDoc.getPage(i);
        const vp = page.getViewport({ scale: scale / 72 });
        const canvas = document.createElement("canvas");
        canvas.width = vp.width; canvas.height = vp.height;
        const ctx = canvas.getContext("2d")!;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.render({ canvasContext: ctx as any, viewport: vp, canvas } as any).promise;
        const dataUrl = canvas.toDataURL("image/jpeg", quality / 100);
        const b64 = dataUrl.split(",")[1];
        const jpgBytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        const img = await outPdf.embedJpg(jpgBytes);
        const pg = outPdf.addPage([vp.width, vp.height]);
        pg.drawImage(img, { x: 0, y: 0, width: vp.width, height: vp.height });
        canvas.remove();
      }

      setProgress(95);
      const bytes = await outPdf.save();
      setResultBlob(new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }));
      setProgress(100);
    } catch (e) {
      setError(`Compression failed: ${(e as Error).message}`);
    } finally { setProcessing(false); }
  }

  function reset() { setFile(null); setResultBlob(null); setProgress(0); setError(null); }

  const savings = file && resultBlob ? Math.round((1 - resultBlob.size / file.size) * 100) : 0;

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Warning */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex gap-2 text-xs text-amber-600 dark:text-amber-400">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <span>This compressor rasterises each page to JPEG, then re-embeds it. Text will not be selectable in the output — this is a trade-off for size reduction.</span>
      </div>

      {/* File upload */}
      {!file ? (
        <button onClick={() => fileRef.current?.click()}
          className="w-full rounded-lg border-2 border-dashed border-border/60 bg-secondary/10 hover:border-primary/40 hover:bg-secondary/20 transition-colors py-14 flex flex-col items-center gap-3 cursor-pointer">
          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
            <Download className="h-5 w-5 text-muted-foreground rotate-180" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Drop PDF or tap to select</p>
            <p className="text-xs text-muted-foreground mt-0.5">PDF · max 50 MB</p>
          </div>
        </button>
      ) : (
        <div className="flex items-center gap-3 rounded-md border border-border/60 bg-card px-4 py-3">
          <span className="text-sm font-mono truncate flex-1">{file.name}</span>
          <span className="text-xs text-muted-foreground shrink-0">{formatSize(file.size)}</span>
          <Button variant="ghost" size="sm" onClick={reset} className="shrink-0"><RotateCcw className="h-3.5 w-3.5" /></Button>
        </div>
      )}
      <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setResultBlob(null); } }} />

      {file && (
        <>
          {/* Settings */}
          <div className="rounded-lg border border-border/60 bg-card px-5 py-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <label className="text-sm">Image quality</label>
                  <Tooltip><TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent>Lower = smaller file, more compression artifacts</TooltipContent></Tooltip>
                </div>
                <span className="text-sm font-mono font-semibold">{quality}%</span>
              </div>
              <Slider min={20} max={95} step={5} value={[quality]} onValueChange={([v]) => setQuality(v)} id="pdf-quality" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Smallest file</span><span>Best quality</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <label className="text-sm">Resolution</label>
                  <Tooltip><TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent>DPI for page rasterisation. Higher = sharper but larger.</TooltipContent></Tooltip>
                </div>
                <span className="text-sm font-mono font-semibold">{scale} DPI</span>
              </div>
              <Slider min={72} max={300} step={24} value={[scale]} onValueChange={([v]) => setScale(v)} id="pdf-dpi" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>72 DPI (screen)</span><span>300 DPI (print)</span>
              </div>
            </div>
          </div>

          {/* Progress */}
          {processing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-block h-4 w-4 rounded-full border-2 border-border border-t-primary animate-spin shrink-0" />
                Processing page {Math.ceil(progress / (90 / resultPages) + 1)} of {resultPages}…
              </div>
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-primary transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          {resultBlob && (
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-green-500">Compression complete</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatSize(file.size)} → {formatSize(resultBlob.size)}
                  {savings > 0 && <span className="text-green-500 ml-2 font-semibold">{savings}% smaller</span>}
                </p>
              </div>
              <Button onClick={() => { const a = document.createElement("a"); a.href = URL.createObjectURL(resultBlob!); a.download = file.name.replace(".pdf", "_compressed.pdf"); a.click(); }} id="pdf-download">
                <Download className="h-4 w-4" />Download PDF
              </Button>
            </div>
          )}

          {!processing && !resultBlob && (
            <Button onClick={compress} id="pdf-compress" className="w-full sm:w-auto">
              Compress PDF
            </Button>
          )}
          {resultBlob && !processing && (
            <Button variant="outline" onClick={compress} id="pdf-recompress">
              Re-compress with new settings
            </Button>
          )}
        </>
      )}
    </div>
  );
}
