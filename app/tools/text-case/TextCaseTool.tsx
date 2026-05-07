"use client";

import * as React from "react";
import { Copy, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const caseTransformers: {
  id: string;
  label: string;
  description: string;
  fn: (t: string) => string;
}[] = [
  {
    id: "uppercase",
    label: "UPPER",
    description: "HELLO WORLD",
    fn: (t) => t.toUpperCase(),
  },
  {
    id: "lowercase",
    label: "lower",
    description: "hello world",
    fn: (t) => t.toLowerCase(),
  },
  {
    id: "titleCase",
    label: "Title",
    description: "Hello World",
    fn: (t) =>
      t.replace(
        /\w\S*/g,
        (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()
      ),
  },
  {
    id: "sentenceCase",
    label: "Sentence",
    description: "Hello world",
    fn: (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase(),
  },
  {
    id: "camelCase",
    label: "camelCase",
    description: "helloWorld",
    fn: (t) =>
      t
        .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (m, i) =>
          i === 0 ? m.toLowerCase() : m.toUpperCase()
        )
        .replace(/\s+/g, ""),
  },
  {
    id: "pascalCase",
    label: "PascalCase",
    description: "HelloWorld",
    fn: (t) =>
      t
        .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (m) => m.toUpperCase())
        .replace(/\s+/g, ""),
  },
  {
    id: "snakeCase",
    label: "snake_case",
    description: "hello_world",
    fn: (t) => t.toLowerCase().replace(/[\s-]+/g, "_"),
  },
  {
    id: "kebabCase",
    label: "kebab-case",
    description: "hello-world",
    fn: (t) => t.toLowerCase().replace(/[\s_]+/g, "-"),
  },
  {
    id: "constantCase",
    label: "CONSTANT",
    description: "HELLO_WORLD",
    fn: (t) => t.toUpperCase().replace(/[\s-]+/g, "_"),
  },
  {
    id: "dotCase",
    label: "dot.case",
    description: "hello.world",
    fn: (t) => t.toLowerCase().replace(/[\s_-]+/g, "."),
  },
];

export function TextCaseTool() {
  const [input, setInput] = React.useState("");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  async function handleCopy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  // Keyboard shortcut: Escape to reset
  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setInput("");
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Input text</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">esc</kbd>
            <span>Reset</span>
          </div>
        </div>
        <Textarea
          id="text-case-input"
          placeholder="Type or paste your text here…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="h-32 text-sm font-sans"
          spellCheck={false}
        />
        {input && (
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInput("")}
              className="h-6 px-2 text-xs gap-1 text-muted-foreground"
              id="text-case-reset-btn"
            >
              <RotateCcw className="h-3 w-3" />
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Conversions grid */}
      {input ? (
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
          {caseTransformers.map(({ id, label, description, fn }) => {
            const converted = fn(input);
            return (
              <div
                key={id}
                className="group flex items-center justify-between gap-3 rounded-md border border-border/60 bg-card px-4 py-3 hover:border-primary/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                    {label}
                  </p>
                  <p
                    className="text-sm font-mono text-foreground truncate"
                    id={`case-output-${id}`}
                  >
                    {converted}
                  </p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCopy(converted, id)}
                      id={`copy-${id}`}
                    >
                      {copiedId === id ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy {label}</TooltipContent>
                </Tooltip>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border/60 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Type something above to see all case conversions.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {caseTransformers.length} formats instantly
          </p>
        </div>
      )}
    </div>
  );
}
