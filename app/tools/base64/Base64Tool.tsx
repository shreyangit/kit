"use client";

import * as React from "react";
import { Copy, RotateCcw, Check, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ── Text encoding ──────────────────────────────────────────────────────────
function encode(text: string): string {
  try {
    return btoa(unescape(encodeURIComponent(text)));
  } catch {
    return "Error: invalid input";
  }
}

function decode(b64: string): string {
  try {
    return decodeURIComponent(escape(atob(b64.trim())));
  } catch {
    return "Error: invalid Base64";
  }
}

function isLikelyBase64(s: string): boolean {
  return /^[A-Za-z0-9+/]+=*$/.test(s.trim()) && s.length % 4 === 0;
}

// ── File to base64 ─────────────────────────────────────────────────────────
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Text Tab ──────────────────────────────────────────────────────────────
function TextTab() {
  const [input, setInput] = React.useState("");
  const [mode, setMode] = React.useState<"encode" | "decode">("encode");
  const [copiedOutput, setCopiedOutput] = React.useState(false);

  const autoMode = React.useMemo(() => {
    if (!input.trim()) return mode;
    return isLikelyBase64(input) ? "decode" : "encode";
  }, [input, mode]);

  const output = React.useMemo(() => {
    if (!input.trim()) return "";
    return autoMode === "encode" ? encode(input) : decode(input);
  }, [input, autoMode]);

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopiedOutput(true);
    setTimeout(() => setCopiedOutput(false), 1500);
  }

  function handleSwap() {
    setInput(output);
    setMode(autoMode === "encode" ? "decode" : "encode");
  }

  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") { setInput(""); }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="space-y-4">
      {/* Keyboard hint */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Auto-detects mode.</span>
        <kbd className="px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">esc</kbd>
        <span>Clear</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Input</span>
            {input && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-mono uppercase">
                will {autoMode}
              </span>
            )}
          </div>
          <Textarea
            id="base64-input"
            placeholder="Text or Base64 string…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="h-64 font-mono text-xs leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Output</span>
            <div className="flex gap-1">
              {output && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSwap}
                        className="h-6 px-2 text-xs gap-1"
                        id="base64-swap-btn"
                      >
                        <ArrowUpDown className="h-3 w-3" />
                        Swap
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Use output as input</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="h-6 px-2 text-xs gap-1"
                        id="base64-copy-btn"
                      >
                        {copiedOutput ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        Copy
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy to clipboard</TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>
          </div>
          <Textarea
            id="base64-output"
            readOnly
            placeholder="Output will appear here…"
            value={output}
            className={cn(
              "h-64 font-mono text-xs leading-relaxed",
              output.startsWith("Error") && "border-destructive text-destructive"
            )}
            spellCheck={false}
          />
        </div>
      </div>

      {input && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setInput("")}
          className="text-xs gap-1 text-muted-foreground"
          id="base64-reset-btn"
        >
          <RotateCcw className="h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  );
}

// ── File Tab ───────────────────────────────────────────────────────────────
function FileTab() {
  const [dataUrl, setDataUrl] = React.useState<string>("");
  const [filename, setFilename] = React.useState<string>("");
  const [copied, setCopied] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  async function handleFile(file: File) {
    const result = await fileToBase64(file);
    setDataUrl(result);
    setFilename(file.name);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleCopy() {
    if (!dataUrl) return;
    await navigator.clipboard.writeText(dataUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const isImage = dataUrl.startsWith("data:image/");

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <label
        id="base64-file-dropzone"
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed py-12 cursor-pointer transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border/60 hover:border-primary/40 bg-secondary/30"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <input
          type="file"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <p className="text-sm text-muted-foreground">
          {isDragging ? "Drop file here" : "Drop any file or click to select"}
        </p>
      </label>

      {dataUrl && (
        <div className="space-y-3 animate-fade-in">
          {/* Image preview */}
          {isImage && (
            <div className="rounded-lg border border-border/60 p-3 bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dataUrl}
                alt="Preview"
                className="max-h-48 rounded object-contain mx-auto"
              />
            </div>
          )}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-mono truncate max-w-xs">
                {filename}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                    id="base64-file-copy-btn"
                    className="gap-1 text-xs"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    Copy Data URL
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copies the full data:... URL</TooltipContent>
              </Tooltip>
            </div>
            <Textarea
              readOnly
              value={dataUrl}
              className="h-40 font-mono text-[10px] leading-relaxed"
              id="base64-file-output"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function Base64Tool() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="text" id="base64-tabs">
        <TabsList>
          <TabsTrigger value="text" id="base64-tab-text">Text</TabsTrigger>
          <TabsTrigger value="file" id="base64-tab-file">File</TabsTrigger>
        </TabsList>
        <TabsContent value="text" className="mt-6">
          <TextTab />
        </TabsContent>
        <TabsContent value="file" className="mt-6">
          <FileTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
