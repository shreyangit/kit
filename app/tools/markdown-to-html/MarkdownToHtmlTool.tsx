"use client";

import * as React from "react";
import { marked } from "marked";
import { Copy, Check, Download, Eye, Code2, Bold, Italic, Strikethrough, Link, Code, List, ListOrdered, Quote, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { downloadText } from "@/lib/utils/download";

// Configure marked
marked.setOptions({ breaks: true, gfm: true });

const STARTER = `# Welcome to Markdown → HTML

Write **Markdown** here and see the rendered HTML on the right.

## Features

- Real-time preview
- Raw HTML view
- Copy & download

## Code

\`\`\`js
const greet = name => \`Hello, \${name}!\`;
console.log(greet("world"));
\`\`\`

> Tip: Use the toolbar above for quick formatting.

---

[kit.shreyannarula.com](https://kit.shreyannarula.com)
`;

const FULL_HTML_TEMPLATE = (body: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported from kit</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1a1a1a; }
    pre { background: #f4f4f4; padding: 16px; border-radius: 8px; overflow-x: auto; }
    code { font-family: 'Menlo', 'Monaco', monospace; font-size: 0.875em; }
    pre code { background: none; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 16px; color: #666; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #ddd; padding: 8px 12px; }
    img { max-width: 100%; }
    hr { border: none; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
${body}
</body>
</html>`;

// Toolbar button spec
type ToolbarAction = {
  icon: React.ReactNode;
  label: string;
  id: string;
  wrap?: [string, string];
  insert?: string;
  linePrefix?: string;
};

const TOOLBAR: ToolbarAction[] = [
  { icon: <Bold className="h-3.5 w-3.5" />, label: "Bold (⌘B)", id: "md-bold", wrap: ["**", "**"] },
  { icon: <Italic className="h-3.5 w-3.5" />, label: "Italic (⌘I)", id: "md-italic", wrap: ["_", "_"] },
  { icon: <Strikethrough className="h-3.5 w-3.5" />, label: "Strikethrough", id: "md-strike", wrap: ["~~", "~~"] },
  { icon: <Code className="h-3.5 w-3.5" />, label: "Inline code", id: "md-code", wrap: ["`", "`"] },
  { icon: <Link className="h-3.5 w-3.5" />, label: "Link", id: "md-link", wrap: ["[", "](url)"] },
  { icon: <Quote className="h-3.5 w-3.5" />, label: "Blockquote", id: "md-quote", linePrefix: "> " },
  { icon: <List className="h-3.5 w-3.5" />, label: "Unordered list", id: "md-ul", linePrefix: "- " },
  { icon: <ListOrdered className="h-3.5 w-3.5" />, label: "Ordered list", id: "md-ol", linePrefix: "1. " },
  { icon: <Minus className="h-3.5 w-3.5" />, label: "Horizontal rule", id: "md-hr", insert: "\n\n---\n\n" },
];

export function MarkdownToHtmlTool() {
  const [markdown, setMarkdown] = React.useState(STARTER);
  const [copied, setCopied] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const html = React.useMemo(() => {
    try { return marked(markdown) as string; } catch { return ""; }
  }, [markdown]);

  // Word / line count
  const wordCount = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  const lineCount = markdown.split("\n").length;
  const charCount = markdown.length;

  async function copyHtml() {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function downloadHtml() { downloadText(html, "output.html", "text/html"); }
  function downloadFullPage() { downloadText(FULL_HTML_TEMPLATE(html), "page.html", "text/html"); }

  // Insert / wrap text in textarea
  function applyFormat(action: ToolbarAction) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = markdown.slice(start, end);

    let newText = markdown;
    let cursorOffset = 0;

    if (action.wrap) {
      const [before, after] = action.wrap;
      newText = markdown.slice(0, start) + before + selected + after + markdown.slice(end);
      cursorOffset = before.length;
    } else if (action.insert) {
      newText = markdown.slice(0, start) + action.insert + markdown.slice(end);
      cursorOffset = action.insert.length;
    } else if (action.linePrefix) {
      // Add prefix to beginning of each selected line
      const lineStart = markdown.lastIndexOf("\n", start - 1) + 1;
      const lineEnd = markdown.indexOf("\n", end);
      const targetEnd = lineEnd === -1 ? markdown.length : lineEnd;
      const lines = markdown.slice(lineStart, targetEnd).split("\n");
      const prefixed = lines.map(l => action.linePrefix + l).join("\n");
      newText = markdown.slice(0, lineStart) + prefixed + markdown.slice(targetEnd);
      cursorOffset = action.linePrefix!.length;
    }

    setMarkdown(newText);
    // Restore cursor
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + cursorOffset, end + cursorOffset);
    });
  }

  // Keyboard shortcuts
  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      const target = e.target as HTMLElement;
      if (target !== textareaRef.current) return;
      if (e.key === "b") { e.preventDefault(); applyFormat(TOOLBAR[0]); }
      if (e.key === "i") { e.preventDefault(); applyFormat(TOOLBAR[1]); }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border/60 bg-card px-3 py-2">
        {TOOLBAR.map((action) => (
          <Tooltip key={action.id}>
            <TooltipTrigger asChild>
              <button
                id={action.id}
                onClick={() => applyFormat(action)}
                className="flex h-7 w-7 items-center justify-center rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                aria-label={action.label}
              >
                {action.icon}
              </button>
            </TooltipTrigger>
            <TooltipContent>{action.label}</TooltipContent>
          </Tooltip>
        ))}
        <div className="ml-auto flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={copyHtml} id="md-copy-html">
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                Copy HTML
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy raw HTML</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={downloadHtml} id="md-download-html">
                <Download className="h-3.5 w-3.5" /> .html
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download HTML fragment</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={downloadFullPage} id="md-download-page">
                <Download className="h-3.5 w-3.5" /> Full page
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download as a complete HTML page with styles</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Split pane */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3" style={{ minHeight: "60vh" }}>
        {/* Editor */}
        <div className="flex flex-col rounded-lg border border-border/60 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-secondary/20 border-b border-border/60">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Markdown</span>
            <span className="text-[10px] text-muted-foreground">{wordCount}w · {charCount}c · {lineCount}l</span>
          </div>
          <textarea
            ref={textareaRef}
            id="markdown-input"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="flex-1 w-full bg-background px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none leading-relaxed"
            placeholder="Start typing Markdown…"
            spellCheck={false}
            style={{ minHeight: "50vh" }}
          />
        </div>

        {/* Preview / HTML */}
        <div className="flex flex-col rounded-lg border border-border/60 overflow-hidden">
          <Tabs defaultValue="preview" className="flex flex-col h-full" id="md-output-tabs">
            <div className="flex items-center justify-between px-3 py-2 bg-secondary/20 border-b border-border/60 shrink-0">
              <TabsList className="h-7">
                <TabsTrigger value="preview" id="md-tab-preview" className="h-6 text-[10px]">
                  <Eye className="h-3 w-3 mr-1" />Preview
                </TabsTrigger>
                <TabsTrigger value="html" id="md-tab-html" className="h-6 text-[10px]">
                  <Code2 className="h-3 w-3 mr-1" />HTML
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="preview" className="flex-1 overflow-auto m-0">
              <div
                id="markdown-preview"
                className="prose prose-sm dark:prose-invert max-w-none px-5 py-4 text-foreground"
                dangerouslySetInnerHTML={{ __html: html }}
                style={{ minHeight: "50vh" }}
              />
            </TabsContent>

            <TabsContent value="html" className="flex-1 overflow-auto m-0">
              <pre className="px-4 py-3 font-mono text-xs text-foreground leading-relaxed overflow-auto whitespace-pre-wrap break-all" id="markdown-html-output" style={{ minHeight: "50vh" }}>
                {html}
              </pre>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Prose styles */}
      <style>{`
        .prose h1 { font-size: 1.5rem; font-weight: 700; margin: 0 0 0.75rem; }
        .prose h2 { font-size: 1.25rem; font-weight: 600; margin: 1.5rem 0 0.5rem; }
        .prose h3 { font-size: 1.1rem; font-weight: 600; margin: 1.25rem 0 0.4rem; }
        .prose p { margin: 0 0 0.75rem; line-height: 1.7; }
        .prose ul, .prose ol { margin: 0 0 0.75rem; padding-left: 1.5rem; }
        .prose li { margin-bottom: 0.25rem; }
        .prose code { font-size: 0.8em; background: rgba(128,128,128,0.15); padding: 0.1em 0.35em; border-radius: 3px; font-family: monospace; }
        .prose pre { background: rgba(128,128,128,0.1); border-radius: 8px; padding: 1rem; overflow-x: auto; margin: 0 0 1rem; }
        .prose pre code { background: none; padding: 0; }
        .prose blockquote { border-left: 3px solid var(--primary); padding-left: 1rem; margin: 1rem 0; color: var(--muted-foreground); }
        .prose a { color: var(--primary); text-decoration: underline; }
        .prose hr { border: none; border-top: 1px solid var(--border); margin: 1.5rem 0; }
        .prose table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        .prose td, .prose th { border: 1px solid var(--border); padding: 0.5rem 0.75rem; }
        .prose th { background: rgba(128,128,128,0.08); font-weight: 600; }
        .prose img { max-width: 100%; border-radius: 6px; }
        .prose strong { font-weight: 600; }
      `}</style>
    </div>
  );
}
