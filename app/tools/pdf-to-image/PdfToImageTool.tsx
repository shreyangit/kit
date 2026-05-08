"use client";

import * as React from "react";
import { Upload, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { downloadBlob } from "@/lib/utils/download";
import { formatSize } from "@/components/tool-shell/DropZone";
import { cn } from "@/lib/utils";

type ImageFormat = "image/png" | "image/jpeg";

interface PageResult {
  pageNum: number;
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

async function renderPage(
  pdfPage: import("pdfjs-dist").PDFPageProxy,
  dpi: number,
  format: ImageFormat
): Promise<{ blob: Blob; width: number; height: number }> {
  const scale = dpi / 72;
  const viewport = pdfPage.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext("2d")!;

  if (format === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  await pdfPage.render({ canvasContext: ctx, viewport, canvas }).promise;
  const blob = await new Promise<Blob>((res) => canvas.toBlob(b => res(b!), format, 0.92));
  return { blob, width: canvas.width, height: canvas.height };
}

export function PdfToImageTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [pageCount, setPageCount] = React.useState<number | null>(null);
  const [dpi, setDpi] = React.useState(150);
  const [format, setFormat] = React.useState<ImageFormat>("image/png");
  const [results, setResults] = React.useState<PageResult[]>([]);
  const [converting, setConverting] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Cleanup blob URLs on unmount
  React.useEffect(() => () => { results.forEach(r => URL.revokeObjectURL(r.url)); }, [results]);

  async function loadFile(f: File) {
    setFile(f);
    setResults([]);
    setPageCount(null);
    setLoadError(null);

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      const buf = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      setPageCount(pdf.numPages);
    } catch (e) {
      setLoadError(`Failed to load PDF: ${(e as Error).message}`);
    }
  }

  async function convertAll() {
    if (!file || !pageCount) return;
    setConverting(true);
    setProgress(0);
    results.forEach(r => URL.revokeObjectURL(r.url));
    setResults([]);

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      const newResults: PageResult[] = [];

      for (let i = 1; i <= pageCount; i++) {
        const pdfPage = await pdf.getPage(i);
        const { blob, width, height } = await renderPage(pdfPage, dpi, format);
        const url = URL.createObjectURL(blob);
        newResults.push({ pageNum: i, blob, url, width, height });
        setProgress(Math.round((i / pageCount) * 100));
        setResults([...newResults]);
      }
    } catch (e) {
      setLoadError(`Conversion failed: ${(e as Error).message}`);
    } finally {
      setConverting(false);
    }
  }

  function downloadPage(r: PageResult) {
    const ext = format === "image/png" ? "png" : "jpg";
    const base = file?.name.replace(/\.pdf$/i, "") ?? "page";
    downloadBlob(r.blob, `${base}-page-${r.pageNum}.${ext}`);
  }

  async function downloadAll() {
    for (const r of results) {
      downloadPage(r);
      await new Promise(res => setTimeout(res, 80));
    }
  }

  const ext = format === "image/png" ? "PNG" : "JPG";

  return (
    <div className="space-y-6 max-w-3xl">
      {!file ? (
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.name.endsWith(".pdf")) loadFile(f); }}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border/60 py-14 cursor-pointer hover:border-primary/40 transition-colors bg-secondary/20"
          id="pdf-image-dropzone"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Drop a PDF or click to select</p>
            <p className="text-xs text-muted-foreground">Any PDF · pages exported as images</p>
          </div>
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
        </div>
      ) : (
        <div className="space-y-5">
          {/* File info */}
          <div className="flex items-center gap-3 rounded-md border border-border/60 bg-card px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{pageCount !== null ? `${pageCount} pages · ${formatSize(file.size)}` : loadError ? <span className="text-destructive">{loadError}</span> : "Loading…"}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setResults([]); setPageCount(null); }} id="pdf-image-reset">
              <RotateCcw className="h-4 w-4 mr-1" />Change
            </Button>
          </div>

          {/* Settings */}
          {pageCount && (
            <div className="rounded-lg border border-border/60 bg-card px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>DPI / Resolution</span>
                    <span className="font-mono text-primary">{dpi} DPI</span>
                  </div>
                  <Slider id="pdf-dpi" min={72} max={300} step={1} value={[dpi]} onValueChange={([v]) => setDpi(v)} />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>72 (screen)</span><span>150 (standard)</span><span>300 (print)</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Format</label>
                  <Select value={format} onValueChange={v => setFormat(v as ImageFormat)}>
                    <SelectTrigger id="pdf-image-format" className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image/png">PNG (transparent backgrounds)</SelectItem>
                      <SelectItem value="image/jpeg">JPG (smaller file size)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">{format === "image/png" ? "Preserves transparency" : "White background added"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Convert button */}
          {pageCount && !converting && (
            <div className="flex gap-2">
              <Button onClick={convertAll} id="pdf-image-convert-btn">
                Convert {pageCount} page{pageCount !== 1 ? "s" : ""} to {ext}
              </Button>
              {results.length === pageCount && (
                <Button variant="outline" onClick={downloadAll} id="pdf-image-download-all">
                  <Download className="h-4 w-4" />Download all
                </Button>
              )}
            </div>
          )}

          {/* Progress */}
          {converting && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-block h-4 w-4 rounded-full border-2 border-border border-t-primary animate-spin" />
                Converting page {Math.ceil(progress / 100 * (pageCount ?? 1))} of {pageCount}…
              </div>
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-primary transition-all duration-200 rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Results grid */}
          {results.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {results.map(r => (
                <div key={r.pageNum} className="group rounded-lg border border-border/60 overflow-hidden bg-secondary/10 space-y-0">
                  <div className="aspect-[3/4] bg-white flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.url} alt={`Page ${r.pageNum}`} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="px-3 py-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium">Page {r.pageNum}</p>
                      <p className="text-[10px] text-muted-foreground">{r.width}×{r.height} · {formatSize(r.blob.size)}</p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button onClick={() => downloadPage(r)} className="p-1.5 rounded hover:bg-secondary transition-colors" id={`pdf-page-dl-${r.pageNum}`} aria-label={`Download page ${r.pageNum}`}>
                          <Download className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Download page {r.pageNum}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
