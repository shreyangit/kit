"use client";

import * as React from "react";
import { Copy, Check, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { downloadText } from "@/lib/utils/download";

const WORDS = [
  "lorem","ipsum","dolor","sit","amet","consectetur","adipiscing","elit","sed","do","eiusmod","tempor",
  "incididunt","ut","labore","et","dolore","magna","aliqua","enim","ad","minim","veniam","quis",
  "nostrud","exercitation","ullamco","laboris","nisi","aliquip","ex","ea","commodo","consequat",
  "duis","aute","irure","in","reprehenderit","voluptate","velit","esse","cillum","fugiat","nulla",
  "pariatur","excepteur","sint","occaecat","cupidatat","non","proident","sunt","culpa","qui",
  "officia","deserunt","mollit","anim","est","laborum","perspiciatis","unde","omnis","iste","natus",
  "error","voluptatem","accusantium","doloremque","laudantium","totam","rem","aperiam","eaque",
  "ipsa","quae","ab","illo","inventore","veritatis","quasi","architecto","beatae","vitae","dicta","explicabo",
  "nemo","ipsam","quia","voluptas","aspernatur","aut","odit","fugit","sed","quia","consequuntur",
  "magni","dolores","eos","qui","ratione","sequi","nesciunt","neque","porro","quisquam","dolorem",
];

function rand(max: number): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] % max;
}

function rRange(min: number, max: number) { return min + rand(max - min + 1); }

function sentence(wordCount: number): string {
  const ws = Array.from({ length: wordCount }, () => WORDS[rand(WORDS.length)]);
  ws[0] = ws[0][0].toUpperCase() + ws[0].slice(1);
  if (wordCount > 6 && rand(3) === 0) {
    const p = rRange(3, wordCount - 3);
    ws[p] += ",";
  }
  return ws.join(" ") + ".";
}

function paragraph(sentenceCount: number): string {
  return Array.from({ length: sentenceCount }, () => sentence(rRange(8, 20))).join(" ");
}

type OutputType = "paragraphs" | "sentences" | "words";
type Format = "plain" | "html" | "markdown";

function generate(count: number, type: OutputType, format: Format, startWithLorem: boolean): string {
  if (type === "paragraphs") {
    const paras = Array.from({ length: count }, (_, i) => {
      let p = paragraph(rRange(3, 7));
      if (i === 0 && startWithLorem) p = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " + p;
      return p;
    });
    if (format === "html") return paras.map(p => `<p>${p}</p>`).join("\n");
    return paras.join("\n\n");
  }
  if (type === "sentences") {
    const ss = Array.from({ length: count }, (_, i) => {
      const s = sentence(rRange(8, 20));
      return (i === 0 && startWithLorem) ? "Lorem ipsum dolor sit amet. " + s : s;
    });
    return ss.join(" ");
  }
  // words
  const ws = Array.from({ length: count }, () => WORDS[rand(WORDS.length)]);
  if (startWithLorem) { ws[0] = "lorem"; if (ws.length > 1) ws[1] = "ipsum"; }
  if (format === "html") return `<p>${ws.join(" ")}</p>`;
  return ws.join(" ");
}

const PRESETS = [
  { label: "1 paragraph", count: 1, type: "paragraphs" as OutputType },
  { label: "5 paragraphs", count: 5, type: "paragraphs" as OutputType },
  { label: "100 words", count: 100, type: "words" as OutputType },
  { label: "500 words", count: 500, type: "words" as OutputType },
  { label: "10 sentences", count: 10, type: "sentences" as OutputType },
];

export function LoremIpsumTool() {
  const [count, setCount] = React.useState(3);
  const [type, setType] = React.useState<OutputType>("paragraphs");
  const [format, setFormat] = React.useState<Format>("plain");
  const [startWithLorem, setStartWithLorem] = React.useState(true);
  const [output, setOutput] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  // Auto-generate on mount & changes
  React.useEffect(() => { setOutput(generate(count, type, format, startWithLorem)); }, [count, type, format, startWithLorem]);

  function regenerate() { setOutput(generate(count, type, format, startWithLorem)); }

  async function copy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const wordCount = output.split(/\s+/).filter(Boolean).length;
  const charCount = output.length;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">Count</label>
          <input
            id="lorem-count"
            type="number"
            value={count}
            min={1}
            max={type === "words" ? 5000 : 100}
            onChange={e => setCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <Select value={type} onValueChange={v => setType(v as OutputType)}>
          <SelectTrigger id="lorem-type" className="w-36 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paragraphs">Paragraphs</SelectItem>
            <SelectItem value="sentences">Sentences</SelectItem>
            <SelectItem value="words">Words</SelectItem>
          </SelectContent>
        </Select>

        <Select value={format} onValueChange={v => setFormat(v as Format)}>
          <SelectTrigger id="lorem-format" className="w-32 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="plain">Plain text</SelectItem>
            <SelectItem value="html">HTML &lt;p&gt;</SelectItem>
            <SelectItem value="markdown">Markdown</SelectItem>
          </SelectContent>
        </Select>

        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
          <Switch id="lorem-start" checked={startWithLorem} onCheckedChange={setStartWithLorem} />
          Start with "Lorem ipsum"
        </label>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map(p => (
          <button
            key={p.label}
            id={`lorem-preset-${p.label.replace(/\s/g, "-")}`}
            onClick={() => { setCount(p.count); setType(p.type); }}
            className="px-2.5 py-1 rounded text-[10px] bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Output */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-mono">
            {wordCount.toLocaleString()} words · {charCount.toLocaleString()} chars
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={regenerate} id="lorem-regenerate">
              <RefreshCw className="h-3.5 w-3.5" />Regenerate
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={copy} id="lorem-copy">
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => downloadText(output, "lorem.txt")} id="lorem-download">
              <Download className="h-3.5 w-3.5" />Download
            </Button>
          </div>
        </div>
        <Textarea
          id="lorem-output"
          readOnly
          value={output}
          className="h-64 sm:h-80 text-sm font-sans leading-relaxed resize-none"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
