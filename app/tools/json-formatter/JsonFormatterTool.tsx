"use client";

import * as React from "react";
import { Copy, Download, RotateCcw, Minimize2, Maximize2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { downloadText } from "@/lib/utils/download";
import { cn } from "@/lib/utils";

function formatJSON(input: string, indent: number): { result?: string; error?: string } {
  try {
    const parsed = JSON.parse(input);
    return { result: JSON.stringify(parsed, null, indent) };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

function minifyJSON(input: string): { result?: string; error?: string } {
  try {
    return { result: JSON.stringify(JSON.parse(input)) };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export function JsonFormatterTool() {
  const [input, setInput] = React.useState("");
  const [output, setOutput] = React.useState("");
  const [error, setError] = React.useState("");
  const [indent, setIndent] = React.useState("2");
  const [copied, setCopied] = React.useState(false);

  // Keyboard shortcuts
  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleFormat();
      }
      if (e.key === "Escape") {
        setInput("");
        setOutput("");
        setError("");
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s" && output) {
        e.preventDefault();
        downloadText(output, "formatted.json", "application/json");
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  function handleFormat() {
    if (!input.trim()) return;
    const res = formatJSON(input, parseInt(indent));
    if (res.result !== undefined) {
      setOutput(res.result);
      setError("");
    } else {
      setError(res.error ?? "Invalid JSON");
      setOutput("");
    }
  }

  function handleMinify() {
    if (!input.trim()) return;
    const res = minifyJSON(input);
    if (res.result !== undefined) {
      setOutput(res.result);
      setError("");
    } else {
      setError(res.error ?? "Invalid JSON");
      setOutput("");
    }
  }

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleReset() {
    setInput("");
    setOutput("");
    setError("");
  }

  // Validate in real-time (debounced)
  const [isValid, setIsValid] = React.useState<boolean | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => {
    if (!input.trim()) { setIsValid(null); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try { JSON.parse(input); setIsValid(true); }
      catch { setIsValid(false); }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [input]);

  return (
    <div className="space-y-4">
      {/* Keyboard hint */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>Shortcuts:</span>
        <kbd className="px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">⌘↵</kbd>
        <span>Format</span>
        <kbd className="px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">esc</kbd>
        <span>Reset</span>
        <kbd className="px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">⌘S</kbd>
        <span>Download</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Input</span>
            {isValid !== null && (
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full",
                  isValid
                    ? "bg-green-500/10 text-green-500"
                    : "bg-destructive/10 text-destructive"
                )}
              >
                {isValid ? "Valid JSON" : "Invalid"}
              </span>
            )}
          </div>
          <Textarea
            id="json-input"
            placeholder='{"key": "value"}'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="h-80 font-mono text-xs leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Output</span>
            {output && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-6 px-2 text-xs gap-1"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy to clipboard</TooltipContent>
              </Tooltip>
            )}
          </div>
          <Textarea
            id="json-output"
            readOnly
            placeholder="Output will appear here…"
            value={output || error}
            className={cn(
              "h-80 font-mono text-xs leading-relaxed",
              error && "border-destructive text-destructive"
            )}
            spellCheck={false}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Indent</span>
          <Select value={indent} onValueChange={setIndent}>
            <SelectTrigger id="json-indent" className="h-9 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="8">8</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button id="json-format-btn" onClick={handleFormat} disabled={!input.trim()}>
          <Maximize2 className="h-4 w-4" />
          Format
        </Button>
        <Button id="json-minify-btn" variant="outline" onClick={handleMinify} disabled={!input.trim()}>
          <Minimize2 className="h-4 w-4" />
          Minify
        </Button>

        {output && (
          <Button
            id="json-download-btn"
            variant="outline"
            onClick={() => downloadText(output, "formatted.json", "application/json")}
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        )}

        <Button variant="ghost" size="icon" onClick={handleReset} id="json-reset-btn">
          <Tooltip>
            <TooltipTrigger asChild>
              <span><RotateCcw className="h-4 w-4" /></span>
            </TooltipTrigger>
            <TooltipContent>Reset (Esc)</TooltipContent>
          </Tooltip>
        </Button>
      </div>
    </div>
  );
}
