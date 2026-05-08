"use client";

import * as React from "react";
import { PDFDocument } from "pdf-lib";
import { Upload, Download, Trash2, ChevronUp, ChevronDown, Scissors, Merge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { downloadBlob } from "@/lib/utils/download";
import { formatSize } from "@/components/tool-shell/DropZone";
import { cn } from "@/lib/utils";

interface PdfFile {
  file: File;
  pageCount: number | null;
  error: string | null;
  id: string;
}

async function getPageCount(file: File): Promise<number> {
  const buf = await file.arrayBuffer();
  const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
  return doc.getPageCount();
}

// Parse page range string like "1-3, 5, 7-9" → 0-indexed page indices
function parsePageRange(rangeStr: string, total: number): number[] | string {
  const indices: number[] = [];
  const parts = rangeStr.split(",").map(s => s.trim()).filter(Boolean);
  for (const part of parts) {
    if (/^\d+$/.test(part)) {
      const n = parseInt(part);
      if (n < 1 || n > total) return `Page ${n} is out of range (1–${total})`;
      indices.push(n - 1);
    } else if (/^\d+-\d+$/.test(part)) {
      const [a, b] = part.split("-").map(Number);
      if (a < 1 || b > total || a > b) return `Invalid range "${part}" (valid: 1–${total})`;
      for (let i = a; i <= b; i++) indices.push(i - 1);
    } else {
      return `Invalid range format: "${part}". Use "1-3, 5, 7"`;
    }
  }
  return [...new Set(indices)].sort((a, b) => a - b);
}

// ── Merge Tab ─────────────────────────────────────────────────────────────

function MergeTab() {
  const [files, setFiles] = React.useState<PdfFile[]>([]);
  const [processing, setProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const dropRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function addFiles(newFiles: File[]) {
    const pdfs = newFiles.filter(f => f.type === "application/pdf" || f.name.endsWith(".pdf"));
    if (!pdfs.length) return;
    const entries: PdfFile[] = pdfs.map(f => ({ file: f, pageCount: null, error: null, id: Math.random().toString(36).slice(2) }));
    setFiles(prev => [...prev, ...entries]);
    // Load page counts
    for (const entry of entries) {
      try {
        const count = await getPageCount(entry.file);
        setFiles(prev => prev.map(e => e.id === entry.id ? { ...e, pageCount: count } : e));
      } catch {
        setFiles(prev => prev.map(e => e.id === entry.id ? { ...e, error: "Could not read PDF (encrypted?)" } : e));
      }
    }
  }

  function move(id: string, dir: -1 | 1) {
    setFiles(prev => {
      const idx = prev.findIndex(f => f.id === id);
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }

  async function merge() {
    const valid = files.filter(f => !f.error);
    if (valid.length < 1) return;
    setProcessing(true);
    setError(null);
    try {
      const merged = await PDFDocument.create();
      for (const { file } of valid) {
        const buf = await file.arrayBuffer();
        const src = await PDFDocument.load(buf, { ignoreEncryption: true });
        const pages = await merged.copyPages(src, src.getPageIndices());
        pages.forEach(p => merged.addPage(p));
      }
      const bytes = await merged.save();
      downloadBlob(new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }), "merged.pdf");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcessing(false);
    }
  }

  const totalPages = files.reduce((s, f) => s + (f.pageCount ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        ref={dropRef}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); addFiles(Array.from(e.dataTransfer.files)); }}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border/60 py-12 cursor-pointer hover:border-primary/40 transition-colors bg-secondary/20"
        id="pdf-merge-dropzone"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <Upload className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">Drop PDFs here or click to select</p>
          <p className="text-xs text-muted-foreground mt-1">Multiple files OK · drag to reorder</p>
        </div>
        <input ref={inputRef} type="file" accept=".pdf,application/pdf" multiple className="sr-only" onChange={e => addFiles(Array.from(e.target.files ?? []))} />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((f, idx) => (
            <div key={f.id} className={cn("flex items-center gap-3 rounded-md border px-4 py-2.5", f.error ? "border-destructive/30 bg-destructive/5" : "border-border/60 bg-card")}>
              <span className="text-[10px] font-mono text-muted-foreground w-5 text-center">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{f.file.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {f.error ? <span className="text-destructive">{f.error}</span> : f.pageCount !== null ? `${f.pageCount} page${f.pageCount !== 1 ? "s" : ""} · ${formatSize(f.file.size)}` : "Loading…"}
                </p>
              </div>
              <div className="flex items-center gap-0.5">
                <button onClick={() => move(f.id, -1)} disabled={idx === 0} className="p-1 rounded hover:bg-secondary disabled:opacity-30" aria-label="Move up"><ChevronUp className="h-3.5 w-3.5" /></button>
                <button onClick={() => move(f.id, 1)} disabled={idx === files.length - 1} className="p-1 rounded hover:bg-secondary disabled:opacity-30" aria-label="Move down"><ChevronDown className="h-3.5 w-3.5" /></button>
                <button onClick={() => setFiles(prev => prev.filter(x => x.id !== f.id))} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive" aria-label="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground pt-1">{files.length} files · {totalPages} total pages</p>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {files.length > 0 && (
        <Button onClick={merge} disabled={processing || files.length < 1} id="pdf-merge-btn">
          {processing ? <><span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />Merging…</> : <><Merge className="h-4 w-4" />Merge {files.length} PDFs</>}
        </Button>
      )}
    </div>
  );
}

// ── Split Tab ─────────────────────────────────────────────────────────────

function SplitTab() {
  const [file, setFile] = React.useState<File | null>(null);
  const [pageCount, setPageCount] = React.useState<number | null>(null);
  const [rangeStr, setRangeStr] = React.useState("");
  const [splitBy, setSplitBy] = React.useState<"range" | "each">("range");
  const [processing, setProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function loadFile(f: File) {
    setFile(f);
    setPageCount(null);
    setError(null);
    try {
      const count = await getPageCount(f);
      setPageCount(count);
    } catch { setError("Could not read PDF (encrypted?)."); }
  }

  async function handleSplit() {
    if (!file || !pageCount) return;
    setProcessing(true);
    setError(null);
    try {
      const srcBuf = await file.arrayBuffer();

      if (splitBy === "each") {
        for (let i = 0; i < pageCount; i++) {
          const src = await PDFDocument.load(srcBuf);
          const out = await PDFDocument.create();
          const [page] = await out.copyPages(src, [i]);
          out.addPage(page);
          const bytes = await out.save();
          downloadBlob(new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }), `page-${i + 1}.pdf`);
          await new Promise(r => setTimeout(r, 100)); // slight delay between downloads
        }
      } else {
        const indices = parsePageRange(rangeStr || `1-${pageCount}`, pageCount);
        if (typeof indices === "string") { setError(indices); return; }
        const src = await PDFDocument.load(srcBuf);
        const out = await PDFDocument.create();
        const pages = await out.copyPages(src, indices);
        pages.forEach(p => out.addPage(p));
        const bytes = await out.save();
        downloadBlob(new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }), `split.pdf`);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally { setProcessing(false); }
  }

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) loadFile(f); }}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border/60 py-12 cursor-pointer hover:border-primary/40 transition-colors bg-secondary/20"
          id="pdf-split-dropzone"
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">Drop a PDF to split</p>
            <p className="text-xs text-muted-foreground">Single file</p>
          </div>
          <input ref={inputRef} type="file" accept=".pdf" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-md border border-border/60 bg-card px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{pageCount !== null ? `${pageCount} pages · ${formatSize(file.size)}` : "Loading…"}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setPageCount(null); setRangeStr(""); }} id="pdf-split-reset">
              Change file
            </Button>
          </div>

          {pageCount && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {(["range", "each"] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setSplitBy(m)}
                    id={`split-mode-${m}`}
                    className={cn("flex-1 rounded-md border py-2 text-xs font-medium transition-colors", splitBy === m ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40")}
                  >
                    {m === "range" ? "Extract page range" : `Split into ${pageCount} individual pages`}
                  </button>
                ))}
              </div>

              {splitBy === "range" && (
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground" htmlFor="pdf-split-range">
                    Page range <span className="text-muted-foreground/60">(e.g. 1-3, 5, 7-9)</span>
                  </label>
                  <Input
                    id="pdf-split-range"
                    value={rangeStr}
                    onChange={e => setRangeStr(e.target.value)}
                    placeholder={`1-${pageCount}`}
                    className="font-mono text-sm max-w-sm"
                  />
                  <p className="text-[10px] text-muted-foreground">Leave empty to extract all {pageCount} pages</p>
                </div>
              )}

              {error && <p className="text-xs text-destructive">{error}</p>}

              <Button onClick={handleSplit} disabled={processing} id="pdf-split-btn">
                {processing
                  ? <><span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />Splitting…</>
                  : <><Scissors className="h-4 w-4" />{splitBy === "each" ? `Download ${pageCount} individual PDFs` : "Extract & Download"}</>}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────

export function PdfMergerTool() {
  return (
    <div className="space-y-5 max-w-3xl">
      <Tabs defaultValue="merge" id="pdf-tabs">
        <TabsList>
          <TabsTrigger value="merge" id="pdf-tab-merge"><Merge className="h-3.5 w-3.5 mr-1.5" />Merge</TabsTrigger>
          <TabsTrigger value="split" id="pdf-tab-split"><Scissors className="h-3.5 w-3.5 mr-1.5" />Split</TabsTrigger>
        </TabsList>
        <TabsContent value="merge" className="mt-5"><MergeTab /></TabsContent>
        <TabsContent value="split" className="mt-5"><SplitTab /></TabsContent>
      </Tabs>
    </div>
  );
}
