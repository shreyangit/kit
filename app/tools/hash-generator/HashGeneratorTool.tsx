"use client";

import * as React from "react";
import SparkMD5 from "spark-md5";
import { Copy, Check, RotateCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatSize } from "@/components/tool-shell/DropZone";
import { cn } from "@/lib/utils";

type Algorithm = "MD5" | "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

const ALGOS: Algorithm[] = ["MD5", "SHA-1", "SHA-256", "SHA-384", "SHA-512"];

const ALGO_BITS: Record<Algorithm, number> = {
  MD5: 128,
  "SHA-1": 160,
  "SHA-256": 256,
  "SHA-384": 384,
  "SHA-512": 512,
};

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function computeHashes(buffer: ArrayBuffer): Promise<Record<Algorithm, string>> {
  const [sha1, sha256, sha384, sha512] = await Promise.all([
    crypto.subtle.digest("SHA-1", buffer).then(toHex),
    crypto.subtle.digest("SHA-256", buffer).then(toHex),
    crypto.subtle.digest("SHA-384", buffer).then(toHex),
    crypto.subtle.digest("SHA-512", buffer).then(toHex),
  ]);
  const md5 = SparkMD5.ArrayBuffer.hash(buffer);
  return { MD5: md5, "SHA-1": sha1, "SHA-256": sha256, "SHA-384": sha384, "SHA-512": sha512 };
}

// ── Hash Row ────────────────────────────────────────────────────────────────

function HashRow({ algo, value, upper }: { algo: Algorithm; value: string; upper: boolean }) {
  const [copied, setCopied] = React.useState(false);
  const display = upper ? value.toUpperCase() : value;

  async function copy() {
    await navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="group rounded-md border border-border/60 bg-card px-4 py-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">{algo}</span>
          <span className="text-[10px] text-muted-foreground">{ALGO_BITS[algo]} bits</span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={copy}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-secondary"
              id={`copy-${algo}`}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </TooltipTrigger>
          <TooltipContent>Copy {algo}</TooltipContent>
        </Tooltip>
      </div>
      <p className="font-mono text-xs text-foreground break-all leading-relaxed select-all" id={`hash-${algo}`}>
        {display}
      </p>
    </div>
  );
}

// ── Text Tab ────────────────────────────────────────────────────────────────

function TextTab() {
  const [input, setInput] = React.useState("");
  const [hashes, setHashes] = React.useState<Record<Algorithm, string> | null>(null);
  const [upper, setUpper] = React.useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => {
    if (!input) { setHashes(null); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const buf = new TextEncoder().encode(input).buffer as ArrayBuffer;
      const result = await computeHashes(buf);
      setHashes(result);
    }, 150);
    return () => clearTimeout(debounceRef.current);
  }, [input]);

  async function copyAll() {
    if (!hashes) return;
    const text = ALGOS.map((a) => `${a}: ${upper ? hashes[a].toUpperCase() : hashes[a]}`).join("\n");
    await navigator.clipboard.writeText(text);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Input text</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">esc</kbd>
            <span>Clear</span>
          </div>
        </div>
        <Textarea
          id="hash-text-input"
          placeholder="Type or paste text to hash…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") setInput(""); }}
          className="h-32 font-mono text-sm"
          spellCheck={false}
        />
        {input && (
          <p className="text-[10px] text-muted-foreground text-right">{input.length} chars · {new Blob([input]).size} bytes</p>
        )}
      </div>

      {hashes && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Results</span>
            <div className="flex gap-2">
              <button
                onClick={() => setUpper(!upper)}
                className={cn("text-[10px] px-2 py-1 rounded border font-mono transition-colors", upper ? "border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40")}
                id="hash-case-toggle"
              >
                {upper ? "UPPER" : "lower"}
              </button>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={copyAll} id="hash-copy-all">
                <Copy className="h-3 w-3" /> Copy all
              </Button>
            </div>
          </div>
          {ALGOS.map((a) => <HashRow key={a} algo={a} value={hashes[a]} upper={upper} />)}
        </div>
      )}

      {!input && (
        <div className="rounded-lg border border-dashed border-border/60 py-12 text-center">
          <p className="text-sm text-muted-foreground">Hashes appear as you type.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">MD5 · SHA-1 · SHA-256 · SHA-384 · SHA-512</p>
        </div>
      )}
    </div>
  );
}

// ── File Tab ────────────────────────────────────────────────────────────────

function FileTab() {
  const [file, setFile] = React.useState<File | null>(null);
  const [hashes, setHashes] = React.useState<Record<Algorithm, string> | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [upper, setUpper] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(f: File) {
    if (f.size > 500 * 1024 * 1024) { setError("File too large. Max 500 MB."); return; }
    setFile(f);
    setError(null);
    setHashes(null);
    setLoading(true);
    try {
      const buf = await f.arrayBuffer();
      setHashes(await computeHashes(buf));
    } catch { setError("Failed to read file."); }
    finally { setLoading(false); }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border/60 py-14 cursor-pointer hover:border-primary/40 transition-colors bg-secondary/20"
          id="hash-file-dropzone"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Drop any file or click to select</p>
            <p className="text-xs text-muted-foreground mt-1">Any file type · max 500 MB</p>
          </div>
          <input ref={inputRef} type="file" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-3 rounded-md border border-border/60 bg-card px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => { setFile(null); setHashes(null); }} id="hash-file-reset" aria-label="Remove file">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-block h-4 w-4 rounded-full border-2 border-border border-t-primary animate-spin" />
              Computing hashes…
            </div>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}

          {hashes && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Results</span>
                <button
                  onClick={() => setUpper(!upper)}
                  className={cn("text-[10px] px-2 py-1 rounded border font-mono transition-colors", upper ? "border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40")}
                  id="hash-file-case-toggle"
                >
                  {upper ? "UPPER" : "lower"}
                </button>
              </div>
              {ALGOS.map((a) => <HashRow key={a} algo={a} value={hashes[a]} upper={upper} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Compare Tab ─────────────────────────────────────────────────────────────

function CompareTab() {
  const [a, setA] = React.useState("");
  const [b, setB] = React.useState("");

  const match = a.trim() && b.trim()
    ? a.trim().toLowerCase() === b.trim().toLowerCase()
    : null;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Paste two hashes to verify they match. Comparison is case-insensitive.</p>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Hash A</label>
          <input
            id="compare-hash-a"
            value={a}
            onChange={(e) => setA(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g. 5d41402abc4b2a76b9719d911017c592"
            spellCheck={false}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Hash B</label>
          <input
            id="compare-hash-b"
            value={b}
            onChange={(e) => setB(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g. 5d41402abc4b2a76b9719d911017c592"
            spellCheck={false}
          />
        </div>
      </div>

      {match !== null && (
        <div className={cn("rounded-lg border px-5 py-4 text-center animate-fade-in", match ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5")} id="compare-result">
          <p className={cn("text-lg font-semibold", match ? "text-green-500" : "text-destructive")}>
            {match ? "✓ Match" : "✗ No match"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {match ? "The two hashes are identical." : "The hashes differ — files or texts are not the same."}
          </p>
        </div>
      )}

      {match === null && (
        <div className="rounded-lg border border-dashed border-border/60 py-10 text-center">
          <p className="text-sm text-muted-foreground">Enter two hashes above to compare them.</p>
        </div>
      )}
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────

export function HashGeneratorTool() {
  return (
    <div className="space-y-6 max-w-2xl">
      <Tabs defaultValue="text" id="hash-tabs">
        <TabsList>
          <TabsTrigger value="text" id="hash-tab-text">Text</TabsTrigger>
          <TabsTrigger value="file" id="hash-tab-file">File</TabsTrigger>
          <TabsTrigger value="compare" id="hash-tab-compare">Compare</TabsTrigger>
        </TabsList>
        <TabsContent value="text" className="mt-6"><TextTab /></TabsContent>
        <TabsContent value="file" className="mt-6"><FileTab /></TabsContent>
        <TabsContent value="compare" className="mt-6"><CompareTab /></TabsContent>
      </Tabs>
    </div>
  );
}
