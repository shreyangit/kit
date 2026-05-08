"use client";

import * as React from "react";
import { ArrowLeftRight, Copy, Check, RotateCcw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Mode = "component" | "full" | "base64" | "form";

const MODES: { value: Mode; label: string; hint: string }[] = [
  { value: "component", label: "URI Component", hint: "Encodes most special chars. Best for query string values." },
  { value: "full", label: "Full URI", hint: "Preserves /:@?=& — for whole URL encoding." },
  { value: "base64", label: "Base64", hint: "Encodes as Base64 string." },
  { value: "form", label: "Form Encoded", hint: "Spaces become + (application/x-www-form-urlencoded)." },
];

function encode(input: string, mode: Mode): string {
  try {
    switch (mode) {
      case "component": return encodeURIComponent(input);
      case "full": return encodeURI(input);
      case "base64": return btoa(unescape(encodeURIComponent(input)));
      case "form": return encodeURIComponent(input).replace(/%20/g, "+");
    }
  } catch { return "[Encoding failed]"; }
}

function decode(input: string, mode: Mode): string {
  try {
    switch (mode) {
      case "component": return decodeURIComponent(input);
      case "full": return decodeURI(input);
      case "base64": return decodeURIComponent(escape(atob(input)));
      case "form": return decodeURIComponent(input.replace(/\+/g, " "));
    }
  } catch { return "[Invalid encoding — could not decode]"; }
}

function parseURL(url: string) {
  try {
    const p = new URL(url);
    return {
      protocol: p.protocol,
      host: p.host,
      pathname: p.pathname,
      params: [...p.searchParams.entries()].map(([k, v]) => ({ key: k, raw: v, decoded: decodeURIComponent(v) })),
      hash: p.hash,
    };
  } catch { return null; }
}

function CopyBtn({ text, id }: { text: string; id: string }) {
  const [ok, setOk] = React.useState(false);
  async function copy() { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); }
  return (
    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={copy} id={id}>
      {ok ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {ok ? "Copied!" : "Copy"}
    </Button>
  );
}

export function UrlEncoderTool() {
  const [input, setInput] = React.useState("");
  const [mode, setMode] = React.useState<Mode>("component");
  const [tab, setTab] = React.useState<"encode" | "decode">("encode");

  // Auto-detect: if input looks encoded → switch to decode
  React.useEffect(() => {
    if (!input) return;
    if (/%[0-9A-Fa-f]{2}/.test(input) || /^[A-Za-z0-9+/]+=*$/.test(input)) {
      setTab("decode");
    } else {
      setTab("encode");
    }
  }, []);

  const output = tab === "encode" ? encode(input, mode) : decode(input, mode);
  const parsed = parseURL(input);

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Mode selector */}
      <div className="flex flex-wrap gap-1.5">
        {MODES.map(m => (
          <Tooltip key={m.value}>
            <TooltipTrigger asChild>
              <button
                id={`url-mode-${m.value}`}
                onClick={() => setMode(m.value)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  mode === m.value ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {m.label}
              </button>
            </TooltipTrigger>
            <TooltipContent>{m.hint}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Encode / Decode tabs */}
      <Tabs value={tab} onValueChange={v => setTab(v as typeof tab)} id="url-encoder-tabs">
        <TabsList>
          <TabsTrigger value="encode" id="url-tab-encode">Encode</TabsTrigger>
          <TabsTrigger value="decode" id="url-tab-decode">Decode</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{tab === "encode" ? "Plain text" : "Encoded input"}</span>
                {input && <button onClick={() => setInput("")} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"><RotateCcw className="h-3 w-3" />Clear</button>}
              </div>
              <Textarea
                id="url-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={tab === "encode" ? "https://example.com/search?q=hello world&lang=en" : "https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world"}
                className="h-36 font-mono text-xs leading-relaxed"
                spellCheck={false}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{tab === "encode" ? "Encoded output" : "Decoded output"}</span>
                {output && (
                  <div className="flex items-center gap-1">
                    <CopyBtn text={output} id="url-copy-output" />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => { setInput(output); setTab(tab === "encode" ? "decode" : "encode"); }} id="url-swap">
                          <ArrowLeftRight className="h-3.5 w-3.5" />Swap
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Flip input/output and switch mode</TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>
              <Textarea
                id="url-output"
                readOnly
                value={output}
                placeholder="Output appears here…"
                className={cn("h-36 font-mono text-xs leading-relaxed", output.startsWith("[") && "text-destructive")}
                spellCheck={false}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* URL Parser */}
      {parsed && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">URL Breakdown</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </div>
          <div className="rounded-lg border border-border/60 bg-card divide-y divide-border/60 overflow-hidden">
            {[
              { label: "Protocol", value: parsed.protocol },
              { label: "Host", value: parsed.host },
              { label: "Path", value: parsed.pathname },
              ...(parsed.hash ? [{ label: "Hash", value: parsed.hash }] : []),
            ].map(r => (
              <div key={r.label} className="flex items-start gap-3 px-4 py-2.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-20 shrink-0 pt-0.5">{r.label}</span>
                <span className="font-mono text-xs text-foreground break-all">{r.value}</span>
              </div>
            ))}
            {parsed.params.length > 0 && (
              <>
                <div className="px-4 py-2 bg-secondary/10">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Query Params ({parsed.params.length})</span>
                </div>
                {parsed.params.map((p, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                    <span className="font-mono text-xs text-primary w-auto shrink-0">{p.key}</span>
                    <span className="text-muted-foreground text-xs">→</span>
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-foreground break-all">{p.decoded}</p>
                      {p.raw !== p.decoded && <p className="font-mono text-[10px] text-muted-foreground/60 break-all">{p.raw}</p>}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
