"use client";

import * as React from "react";
import { ArrowLeftRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type EncodeMode = "basic" | "named" | "numeric";

const NAMED_MAP: Record<string, string> = {
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  "©": "&copy;", "®": "&reg;", "™": "&trade;", "€": "&euro;", "£": "&pound;",
  "¥": "&yen;", "¢": "&cent;", "°": "&deg;", "±": "&plusmn;", "×": "&times;",
  "÷": "&divide;", "→": "&rarr;", "←": "&larr;", "↑": "&uarr;", "↓": "&darr;",
  "•": "&bull;", "…": "&hellip;", "–": "&ndash;", "—": "&mdash;",
  "\u00a0": "&nbsp;", "\u201c": "&ldquo;", "\u201d": "&rdquo;",
};

const ENTITY_REF = [
  { entity: "&amp;", char: "&", code: "38" }, { entity: "&lt;", char: "<", code: "60" },
  { entity: "&gt;", char: ">", code: "62" }, { entity: "&quot;", char: '"', code: "34" },
  { entity: "&apos;", char: "'", code: "39" }, { entity: "&copy;", char: "©", code: "169" },
  { entity: "&reg;", char: "®", code: "174" }, { entity: "&trade;", char: "™", code: "8482" },
  { entity: "&euro;", char: "€", code: "8364" }, { entity: "&pound;", char: "£", code: "163" },
  { entity: "&yen;", char: "¥", code: "165" }, { entity: "&deg;", char: "°", code: "176" },
  { entity: "&times;", char: "×", code: "215" }, { entity: "&divide;", char: "÷", code: "247" },
  { entity: "&rarr;", char: "→", code: "8594" }, { entity: "&larr;", char: "←", code: "8592" },
  { entity: "&bull;", char: "•", code: "8226" }, { entity: "&hellip;", char: "…", code: "8230" },
  { entity: "&ndash;", char: "–", code: "8211" }, { entity: "&mdash;", char: "—", code: "8212" },
  { entity: "&nbsp;", char: "·", code: "160" }, { entity: "&plusmn;", char: "±", code: "177" },
];

function encodeBasic(t: string): string { return t.replace(/[&<>"']/g, c => NAMED_MAP[c] ?? c); }
function encodeNamed(t: string): string { return [...t].map(c => NAMED_MAP[c] ?? c).join(""); }
function encodeNumeric(t: string): string { return [...t].map(c => { const code = c.codePointAt(0)!; return code > 127 ? `&#${code};` : c; }).join(""); }
function decodeEntities(html: string): string {
  if (typeof document === "undefined") return html;
  const d = document.createElement("div");
  d.innerHTML = html;
  return d.textContent ?? "";
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = React.useState(false);
  async function copy() { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1400); }
  return (
    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={copy}>
      {ok ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {ok ? "Copied!" : "Copy"}
    </Button>
  );
}

export function HtmlEntitiesTool() {
  const [input, setInput] = React.useState("");
  const [mode, setMode] = React.useState<EncodeMode>("basic");
  const [tab, setTab] = React.useState<"encode" | "decode">("encode");
  const [refQuery, setRefQuery] = React.useState("");

  const output = React.useMemo(() => {
    if (!input) return "";
    if (tab === "decode") return decodeEntities(input);
    if (mode === "basic") return encodeBasic(input);
    if (mode === "named") return encodeNamed(input);
    return encodeNumeric(input);
  }, [input, mode, tab]);

  const filteredRef = ENTITY_REF.filter(r =>
    !refQuery || r.entity.includes(refQuery) || r.char.includes(refQuery) || r.code.includes(refQuery)
  );

  return (
    <div className="space-y-5 max-w-3xl">
      <Tabs value={tab} onValueChange={v => setTab(v as typeof tab)}>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="encode" id="html-tab-encode">Encode</TabsTrigger>
            <TabsTrigger value="decode" id="html-tab-decode">Decode</TabsTrigger>
          </TabsList>
          {tab === "encode" && (
            <div className="flex gap-1.5">
              {(["basic", "named", "numeric"] as EncodeMode[]).map(m => (
                <button key={m} id={`html-mode-${m}`} onClick={() => setMode(m)}
                  className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    mode === m ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  )}>
                  {m === "basic" ? "Basic (<>&\"')" : m === "named" ? "Named (&amp;)" : "Numeric (&#xxx;)"}
                </button>
              ))}
            </div>
          )}
        </div>

        <TabsContent value={tab}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{tab === "encode" ? "Plain text" : "HTML with entities"}</span>
                {input && <button onClick={() => setInput("")} className="text-[10px] text-muted-foreground hover:text-foreground">Clear</button>}
              </div>
              <Textarea id="html-input" value={input} onChange={e => setInput(e.target.value)}
                placeholder={tab === "encode" ? 'e.g. <p class="hello">Hello & World ©</p>' : 'e.g. &lt;p&gt;Hello &amp; World &copy;&lt;/p&gt;'}
                className="h-40 font-mono text-xs leading-relaxed" spellCheck={false} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Output</span>
                <div className="flex gap-1">
                  {output && <CopyBtn text={output} />}
                  {output && <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => { setInput(output); setTab(tab === "encode" ? "decode" : "encode"); }} id="html-swap">
                    <ArrowLeftRight className="h-3.5 w-3.5" />Swap
                  </Button>}
                </div>
              </div>
              <Textarea id="html-output" readOnly value={output} placeholder="Output appears here…"
                className="h-40 font-mono text-xs leading-relaxed" spellCheck={false} />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Entity reference */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">Entity Reference</span>
          <input type="search" value={refQuery} onChange={e => setRefQuery(e.target.value)}
            placeholder="Search…" className="h-7 rounded border border-input bg-background px-2 text-xs w-32" />
        </div>
        <div className="rounded-lg border border-border/60 overflow-hidden">
          <div className="grid grid-cols-4 text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary/20 px-4 py-2">
            <span>Entity</span><span>Char</span><span>Code</span><span>Click to insert</span>
          </div>
          <div className="divide-y divide-border/40 max-h-48 overflow-y-auto">
            {filteredRef.map(r => (
              <div key={r.entity} className="grid grid-cols-4 px-4 py-1.5 hover:bg-secondary/10 transition-colors items-center">
                <span className="font-mono text-xs text-primary">{r.entity}</span>
                <span className="text-sm">{r.char}</span>
                <span className="font-mono text-xs text-muted-foreground">&#{r.code};</span>
                <button onClick={() => setInput(prev => prev + r.char)}
                  className="text-[10px] text-muted-foreground hover:text-primary text-left transition-colors">
                  Insert →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
