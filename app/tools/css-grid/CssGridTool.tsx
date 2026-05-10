"use client";
import * as React from "react";

function generateGrid(cols: number, rows: number, gap: number, colTemplate: string, rowTemplate: string): string {
  return `.grid-container {
  display: grid;
  grid-template-columns: ${colTemplate || `repeat(${cols}, 1fr)`};
  grid-template-rows: ${rowTemplate || `repeat(${rows}, 1fr)`};
  gap: ${gap}px;
  width: 100%;
}`;
}

export function CssGridTool() {
  const [cols, setCols] = React.useState(3);
  const [rows, setRows] = React.useState(3);
  const [gap, setGap] = React.useState(16);
  const [colTemplate, setColTemplate] = React.useState('');
  const [rowTemplate, setRowTemplate] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  const css = React.useMemo(() => generateGrid(cols, rows, gap, colTemplate, rowTemplate), [cols, rows, gap, colTemplate, rowTemplate]);

  const copy = () => { navigator.clipboard.writeText(css); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  const cells = Array.from({ length: cols * rows }, (_, i) => i + 1);

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Controls */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-muted-foreground mb-1">Columns: {cols}</label>
              <input type="range" min={1} max={8} value={cols} onChange={e => setCols(+e.target.value)} className="w-full accent-foreground" /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Rows: {rows}</label>
              <input type="range" min={1} max={8} value={rows} onChange={e => setRows(+e.target.value)} className="w-full accent-foreground" /></div>
          </div>
          <div><label className="block text-xs text-muted-foreground mb-1">Gap: {gap}px</label>
            <input type="range" min={0} max={48} value={gap} onChange={e => setGap(+e.target.value)} className="w-full accent-foreground" /></div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Custom column template (optional)</label>
            <input className="w-full rounded-md border bg-card px-3 py-2 font-mono text-xs outline-none focus:ring-1 focus:ring-ring"
              value={colTemplate} onChange={e => setColTemplate(e.target.value)} placeholder="1fr 2fr 1fr" /></div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Custom row template (optional)</label>
            <input className="w-full rounded-md border bg-card px-3 py-2 font-mono text-xs outline-none focus:ring-1 focus:ring-ring"
              value={rowTemplate} onChange={e => setRowTemplate(e.target.value)} placeholder="200px auto" /></div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground">Generated CSS</label>
              <button onClick={copy} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{copied ? 'Copied!' : 'Copy'}</button>
            </div>
            <pre className="rounded-lg border bg-card p-3 font-mono text-xs overflow-x-auto">{css}</pre>
          </div>
        </div>
        {/* Live preview */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Live preview</label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: colTemplate || `repeat(${cols}, 1fr)`,
            gridTemplateRows: rowTemplate || `repeat(${rows}, 60px)`,
            gap: `${gap}px`,
          }}>
            {cells.map(i => (
              <div key={i} className="rounded flex items-center justify-center text-xs font-mono text-muted-foreground border border-border bg-card/50" style={{ minHeight: 50 }}>
                {i}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
