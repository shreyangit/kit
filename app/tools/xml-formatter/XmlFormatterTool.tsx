"use client";
import * as React from "react";

function formatXML(xml: string): { result: string; error: string | null } {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml.trim(), 'application/xml');
    const errorNode = doc.querySelector('parsererror');
    if (errorNode) return { result: '', error: errorNode.textContent?.split('\n')[0] ?? 'Parse error' };
    const ser = new XMLSerializer();
    const raw = ser.serializeToString(doc);
    // Pretty-print by indenting
    let indent = 0;
    const lines = raw.replace(/></g, '>\n<').split('\n');
    const pretty = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('</')) { indent = Math.max(0, indent - 1); }
      const result = '  '.repeat(indent) + trimmed;
      if (!trimmed.startsWith('</') && !trimmed.endsWith('/>') && trimmed.startsWith('<') && !trimmed.includes('</')) indent++;
      return result;
    }).filter(Boolean).join('\n');
    return { result: pretty, error: null };
  } catch (e) {
    return { result: '', error: (e as Error).message };
  }
}

function minifyXML(xml: string): string {
  return xml.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
}

export function XmlFormatterTool() {
  const [input, setInput] = React.useState(`<?xml version="1.0" encoding="UTF-8"?>
<catalog><book id="bk101"><author>Gambardella, Matthew</author><title>XML Developer Guide</title><genre>Computer</genre><price>44.95</price></book><book id="bk102"><author>Ralls, Kim</author><title>Midnight Rain</title><genre>Fantasy</genre><price>5.95</price></book></catalog>`);
  const [mode, setMode] = React.useState<'format' | 'minify'>('format');
  const [copied, setCopied] = React.useState(false);

  const { result, error } = React.useMemo(() => {
    if (!input.trim()) return { result: '', error: null };
    return mode === 'format' ? formatXML(input) : { result: minifyXML(input), error: null };
  }, [input, mode]);

  const copy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(['format', 'minify'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${mode === m ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:border-foreground/30'}`}>
            {m === 'format' ? 'Format / Validate' : 'Minify'}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">XML input</label>
          <textarea className="w-full h-72 rounded-md border bg-card px-3 py-2 font-mono text-xs outline-none focus:ring-1 focus:ring-ring resize-none"
            value={input} onChange={e => setInput(e.target.value)} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-muted-foreground">{mode === 'format' ? 'Formatted XML' : 'Minified XML'}</label>
            {!error && result && <button onClick={copy} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{copied ? 'Copied!' : 'Copy'}</button>}
          </div>
          {error ? (
            <div className="h-72 rounded-md border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-400 font-mono overflow-auto">
              <div className="font-semibold mb-1">Validation error</div>
              {error}
            </div>
          ) : (
            <pre className="h-72 rounded-md border bg-card px-3 py-2 font-mono text-xs overflow-auto">{result}</pre>
          )}
        </div>
      </div>

      {!error && result && (
        <div className="text-xs text-muted-foreground">
          {mode === 'format' ? 'Valid XML' : `Minified: ${result.length} chars (was ${input.length})`}
        </div>
      )}
    </div>
  );
}
