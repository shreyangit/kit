"use client";
import * as React from "react";
import { Copy, Check, Download, Upload, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { downloadText } from "@/lib/utils/download";

type Lang = "javascript" | "typescript" | "jsx" | "tsx" | "json" | "css" | "scss" | "html" | "markdown";

const LANGS: { id: Lang; label: string; ext: string; parser: string; plugins: string[] }[] = [
  { id: "javascript", label: "JavaScript", ext: "js", parser: "babel", plugins: ["babel", "estree"] },
  { id: "typescript", label: "TypeScript", ext: "ts", parser: "typescript", plugins: ["typescript", "estree"] },
  { id: "jsx", label: "JSX", ext: "jsx", parser: "babel", plugins: ["babel", "estree"] },
  { id: "tsx", label: "TSX", ext: "tsx", parser: "typescript", plugins: ["typescript", "estree"] },
  { id: "json", label: "JSON", ext: "json", parser: "json", plugins: ["babel", "estree"] },
  { id: "css", label: "CSS", ext: "css", parser: "css", plugins: ["postcss"] },
  { id: "scss", label: "SCSS", ext: "scss", parser: "scss", plugins: ["postcss"] },
  { id: "html", label: "HTML", ext: "html", parser: "html", plugins: ["html"] },
  { id: "markdown", label: "Markdown", ext: "md", parser: "markdown", plugins: ["markdown"] },
];

const EXT_TO_LANG: Record<string, Lang> = {
  js: "javascript", ts: "typescript", jsx: "jsx", tsx: "tsx",
  json: "json", css: "css", scss: "scss", html: "html", md: "markdown",
};

const DEFAULTS: Record<string, string> = {
  javascript: `function   greet(  name ){return "Hello, " +  name +  "!";}console.log(greet("World"))`,
  typescript: `interface User  {  name: string;  age:number }\nconst  greet=(user: User):string=>{ return \`Hello \${user.name}\` }`,
  json: `{"name":"John","age":30,"address":{"city":"New York","zip":"10001"},"hobbies":["reading","coding"]}`,
  css: `.container{display:flex;flex-direction:column;gap:16px;padding:24px;background-color:#f5f5f5;border-radius:8px}`,
  html: `<!DOCTYPE html><html><head><title>My Page</title></head><body><h1>Hello World</h1><p>This is a paragraph.</p></body></html>`,
  markdown: `# Hello World\nThis is a **paragraph** with *emphasis* and \`inline code\`.\n## Section\n- Item 1\n- Item 2`,
};

let prettierCache: unknown = null;
let pluginCache: Record<string, unknown> = {};

async function loadPrettier() {
  if (prettierCache) return prettierCache as { format: (code: string, opts: unknown) => Promise<string> };
  const base = "https://unpkg.com/prettier@3";
  const [main, babel, estree, typescript, postcss, html, markdown] = await Promise.all([
    import(/* webpackIgnore: true */ `${base}/standalone.js` as string),
    import(/* webpackIgnore: true */ `${base}/plugins/babel.js` as string),
    import(/* webpackIgnore: true */ `${base}/plugins/estree.js` as string),
    import(/* webpackIgnore: true */ `${base}/plugins/typescript.js` as string),
    import(/* webpackIgnore: true */ `${base}/plugins/postcss.js` as string),
    import(/* webpackIgnore: true */ `${base}/plugins/html.js` as string),
    import(/* webpackIgnore: true */ `${base}/plugins/markdown.js` as string),
  ]);
  const p = (main as { default?: unknown }).default ?? main;
  pluginCache = {
    babel: (babel as { default?: unknown }).default ?? babel,
    estree: (estree as { default?: unknown }).default ?? estree,
    typescript: (typescript as { default?: unknown }).default ?? typescript,
    postcss: (postcss as { default?: unknown }).default ?? postcss,
    html: (html as { default?: unknown }).default ?? html,
    markdown: (markdown as { default?: unknown }).default ?? markdown,
  };
  prettierCache = p;
  return p as { format: (code: string, opts: unknown) => Promise<string> };
}

export function CodeFormatterTool() {
  const [lang, setLang] = React.useState<Lang>("javascript");
  const [input, setInput] = React.useState(() => DEFAULTS["javascript"]);
  const [output, setOutput] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = React.useState("");
  const [firstLoad, setFirstLoad] = React.useState(true);
  const [tabWidth, setTabWidth] = React.useState(2);
  const [useTabs, setUseTabs] = React.useState(false);
  const [singleQuote, setSingleQuote] = React.useState(true);
  const [semicolons, setSemicolons] = React.useState(true);
  const [printWidth, setPrintWidth] = React.useState(80);
  const [copied, setCopied] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  function changeLang(l: Lang) {
    setLang(l);
    if (!input.trim() || input === DEFAULTS[lang]) setInput(DEFAULTS[l] ?? "");
    setOutput(""); setStatus("idle");
  }

  async function format() {
    setStatus("loading"); setMsg(firstLoad ? "Loading Prettier (~1.5 MB CDN, cached after first use)…" : "Formatting…");
    try {
      const prettier = await loadPrettier();
      setFirstLoad(false); setMsg("Formatting…");
      const langMeta = LANGS.find(l => l.id === lang)!;
      const plugins = langMeta.plugins.map(k => pluginCache[k]).filter(Boolean);
      const formatted = await prettier.format(input, {
        parser: langMeta.parser, plugins,
        tabWidth, useTabs, singleQuote, semi: semicolons, printWidth,
        trailingComma: "es5",
      } as unknown);
      setOutput(formatted); setStatus("done"); setMsg("");
    } catch (e) { setMsg((e as Error).message); setStatus("error"); }
  }

  function handleFileUpload(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const detected = EXT_TO_LANG[ext];
    if (detected) setLang(detected);
    file.text().then(t => { setInput(t); setOutput(""); setStatus("idle"); });
  }

  async function copy() { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500); }

  // Keyboard shortcut Shift+Alt+F
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.shiftKey && e.altKey && e.key === "F") { e.preventDefault(); format(); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [input, lang, tabWidth, useTabs, singleQuote, semicolons, printWidth]);

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Language tabs */}
      <div className="flex flex-wrap gap-1.5">
        {LANGS.map(l => (
          <button key={l.id} onClick={() => changeLang(l.id)}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${lang === l.id ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {l.label}
          </button>
        ))}
      </div>

      {/* Options */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="rounded-lg border border-border/60 bg-card px-4 py-3 flex gap-4 items-center text-xs text-muted-foreground min-w-max">
          <div className="flex items-center gap-2">
            <span>Tab width</span>
            <div className="flex gap-1">
              {[2, 4].map(n => (
                <button key={n} onClick={() => setTabWidth(n)}
                  className={`px-2 py-0.5 rounded text-xs transition-colors ${tabWidth === n ? "bg-foreground text-background" : "bg-secondary hover:text-foreground"}`}>{n}</button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={useTabs} onChange={e => setUseTabs(e.target.checked)} className="rounded" />Use tabs
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={singleQuote} onChange={e => setSingleQuote(e.target.checked)} className="rounded" />Single quotes
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={semicolons} onChange={e => setSemicolons(e.target.checked)} className="rounded" />Semicolons
          </label>
          <div className="flex items-center gap-2">
            <span>Print width</span>
            <input type="number" value={printWidth} min={40} max={200}
              onChange={e => setPrintWidth(parseInt(e.target.value) || 80)}
              className="w-16 rounded-md border border-input bg-background px-2 py-0.5 text-xs text-center focus:outline-none" />
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground">Input</label>
          <button onClick={() => fileRef.current?.click()} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            <Upload className="h-3 w-3" />Upload file
          </button>
        </div>
        <textarea id="formatter-input" value={input} onChange={e => { setInput(e.target.value); setStatus("idle"); setOutput(""); }}
          rows={10}
          className="w-full rounded-md border border-input bg-background px-3 py-2.5 font-mono text-xs leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-ring"
          spellCheck={false} placeholder="Paste unformatted code here…" />
        <input ref={fileRef} type="file" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
      </div>

      {/* Format button */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={format} disabled={status === "loading" || !input.trim()} id="formatter-format" className="gap-1.5">
          <Code className="h-4 w-4" />{status === "loading" ? "Formatting…" : "Format Code"}
        </Button>
        <span className="text-xs text-muted-foreground/50">or Shift+Alt+F</span>
      </div>

      {/* Status */}
      {status === "loading" && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-3.5 w-3.5 rounded-full border-2 border-border border-t-foreground animate-spin inline-block" />{msg}
        </div>
      )}
      {status === "error" && <p className="text-xs text-destructive font-mono">{msg}</p>}

      {/* Output */}
      {status === "done" && output && (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Formatted output</label>
          <textarea readOnly value={output} rows={12}
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 font-mono text-xs leading-relaxed resize-y focus:outline-none"
            spellCheck={false} />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={copy} className="gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied!" : "Copy"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => downloadText(output, `formatted.${LANGS.find(l => l.id === lang)?.ext ?? "txt"}`)} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />Download
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
