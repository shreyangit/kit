"use client";

import * as React from "react";
import { Copy, Check, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropZone, useFilePreview } from "@/components/tool-shell/DropZone";
import { downloadText } from "@/lib/utils/download";
import { cn } from "@/lib/utils";

const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff"];

const LANGUAGES = [
  { code: "eng", label: "English" }, { code: "fra", label: "French" },
  { code: "deu", label: "German" }, { code: "spa", label: "Spanish" },
  { code: "ita", label: "Italian" }, { code: "hin", label: "Hindi" },
  { code: "por", label: "Portuguese" }, { code: "rus", label: "Russian" },
  { code: "jpn", label: "Japanese" }, { code: "kor", label: "Korean" },
  { code: "chi_sim", label: "Chinese (Simplified)" }, { code: "ara", label: "Arabic" },
];

type Status = "idle" | "loading" | "recognizing" | "done" | "error";

export function ImageToTextTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [lang, setLang] = React.useState("eng");
  const [status, setStatus] = React.useState<Status>("idle");
  const [progress, setProgress] = React.useState(0);
  const [statusMsg, setStatusMsg] = React.useState("");
  const [text, setText] = React.useState("");
  const [confidence, setConfidence] = React.useState<number | null>(null);
  const [copied, setCopied] = React.useState(false);
  const workerRef = React.useRef<unknown>(null);

  const previewUrl = useFilePreview(file);

  // Terminate the OCR worker when the component unmounts.
  React.useEffect(() => {
    return () => {
      if (workerRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (workerRef.current as any).terminate?.();
        workerRef.current = null;
      }
    };
  }, []);

  function handleFile(f: File) {
    setFile(f);
    setText(""); setConfidence(null); setStatus("idle"); setProgress(0);
  }

  async function runOcr() {
    if (!file) return;
    setStatus("loading"); setProgress(0); setStatusMsg("Loading OCR engine…");
    try {
      const { createWorker } = await import("tesseract.js");
      if (workerRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (workerRef.current as any).terminate();
        workerRef.current = null;
      }
      const worker = await createWorker(lang, 1, {
        logger: (m: { status: string; progress: number }) => {
          setProgress(Math.round(m.progress * 100));
          if (m.status.includes("loading")) setStatusMsg("Loading OCR engine…");
          else if (m.status.includes("initializing")) setStatusMsg("Initialising language data…");
          else if (m.status.includes("recognizing")) { setStatus("recognizing"); setStatusMsg("Extracting text…"); }
        },
      });
      workerRef.current = worker;
      setStatus("recognizing");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (worker as any).recognize(file);
      setText(result.data.text.trim());
      setConfidence(Math.round(result.data.confidence));
      setStatus("done");
    } catch (e) {
      setStatusMsg(`Error: ${(e as Error).message}`);
      setStatus("error");
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function reset() {
    if (workerRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (workerRef.current as any).terminate?.();
      workerRef.current = null;
    }
    setFile(null); setText(""); setConfidence(null); setStatus("idle"); setProgress(0);
  }

  const busy = status === "loading" || status === "recognizing";
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-5 max-w-3xl">
      {!file ? (
        <DropZone
          accept={ACCEPT}
          maxSizeMB={20}
          onFiles={([f]) => handleFile(f)}
          label="Drop image or click to select"
          sublabel="JPG, PNG, WebP, BMP, TIFF · max 20 MB · runs entirely in your browser"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Image preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground truncate">{file.name}</span>
              <Button variant="ghost" size="sm" onClick={reset} className="h-7 gap-1 text-xs shrink-0"><RefreshCw className="h-3.5 w-3.5" />Change</Button>
            </div>
            <div className="rounded-lg border border-border/60 overflow-hidden bg-secondary/10 flex items-center justify-center" style={{ minHeight: 200 }}>
              {previewUrl && <img src={previewUrl} alt="OCR source" className="w-full object-contain max-h-64" />}
            </div>
          </div>
          {/* Extracted text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground min-w-0 truncate">
                Extracted text
                {confidence !== null && (
                  <span className={cn("ml-2 font-mono", confidence > 85 ? "text-green-500" : confidence > 60 ? "text-amber-500" : "text-destructive")}>
                    {confidence}%
                  </span>
                )}
                {text && <span className="ml-2 opacity-50">{wordCount} words</span>}
              </span>
              {text && (
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={copy}>
                    {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => downloadText(text, "extracted-text.txt")} id="ocr-download">
                    <Download className="h-3.5 w-3.5" />Download
                  </Button>
                </div>
              )}
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Extracted text will appear here — you can edit it before copying…"
              className="w-full h-48 sm:h-56 rounded-md border border-input bg-background px-3 py-2.5 text-sm font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>
      )}

      {/* Language + Run */}
      {file && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Language</label>
            <select id="ocr-lang" value={lang} onChange={e => setLang(e.target.value)} disabled={busy}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50">
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
          <Button onClick={runOcr} disabled={busy} id="ocr-run">
            {status === "idle" ? "Extract Text" : status === "done" ? "Re-run" : status === "error" ? "Retry" : "Processing…"}
          </Button>
        </div>
      )}

      {/* Progress */}
      {busy && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-block h-4 w-4 rounded-full border-2 border-border border-t-primary animate-spin shrink-0" />
            {statusMsg} {progress > 0 && `${progress}%`}
          </div>
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {status === "error" && <p className="text-xs text-destructive">{statusMsg}</p>}
    </div>
  );
}
