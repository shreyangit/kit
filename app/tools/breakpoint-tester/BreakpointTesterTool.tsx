"use client";
import * as React from "react";

const BREAKPOINTS = [
  { label: 'Mobile S', w: 320, h: 568, icon: '📱' },
  { label: 'Mobile M', w: 375, h: 667, icon: '📱' },
  { label: 'Mobile L', w: 414, h: 896, icon: '📱' },
  { label: 'Tablet', w: 768, h: 1024, icon: '📟' },
  { label: 'Laptop', w: 1024, h: 768, icon: '💻' },
  { label: 'Desktop', w: 1280, h: 800, icon: '🖥' },
  { label: '4K', w: 1920, h: 1080, icon: '🖥' },
];

export function BreakpointTesterTool() {
  const [url, setUrl] = React.useState('https://kit.shreyannarula.com');
  const [selected, setSelected] = React.useState(BREAKPOINTS[0]);
  const [orientation, setOrientation] = React.useState<'portrait' | 'landscape'>('portrait');
  const [customW, setCustomW] = React.useState(375);
  const [customH, setCustomH] = React.useState(667);
  const [useCustom, setUseCustom] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  const W = useCustom ? customW : (orientation === 'portrait' ? Math.min(selected.w, selected.h) : Math.max(selected.w, selected.h));
  const H = useCustom ? customH : (orientation === 'portrait' ? Math.max(selected.w, selected.h) : Math.min(selected.w, selected.h));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input className="flex-1 rounded-md border bg-card px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          value={url} onChange={e => { setUrl(e.target.value); setLoaded(false); }} placeholder="https://example.com" />
        <button onClick={() => setLoaded(true)}
          className="px-4 py-2 rounded-md text-sm font-medium bg-foreground text-background hover:opacity-90 transition-opacity shrink-0">
          Load
        </button>
      </div>

      {/* Breakpoint selector */}
      <div className="flex flex-wrap gap-1.5">
        {BREAKPOINTS.map(bp => (
          <button key={bp.label} onClick={() => { setSelected(bp); setUseCustom(false); setLoaded(false); }}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${!useCustom && selected.label === bp.label ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:border-foreground/30'}`}>
            {bp.label} <span className="opacity-60">{bp.w}×{bp.h}</span>
          </button>
        ))}
        <button onClick={() => setUseCustom(true)}
          className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${useCustom ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:border-foreground/30'}`}>
          Custom
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        {useCustom ? (
          <>
            <input type="number" value={customW} onChange={e => setCustomW(+e.target.value)} className="w-24 rounded-md border bg-card px-2 py-1.5 text-sm font-mono outline-none focus:ring-1 focus:ring-ring" placeholder="Width" />
            <span className="text-muted-foreground text-sm">×</span>
            <input type="number" value={customH} onChange={e => setCustomH(+e.target.value)} className="w-24 rounded-md border bg-card px-2 py-1.5 text-sm font-mono outline-none focus:ring-1 focus:ring-ring" placeholder="Height" />
          </>
        ) : (
          <div className="flex gap-1.5">
            {(['portrait', 'landscape'] as const).map(o => (
              <button key={o} onClick={() => setOrientation(o)}
                className={`px-2.5 py-1 rounded-md text-xs border transition-colors capitalize ${orientation === o ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:border-foreground/30'}`}>
                {o}
              </button>
            ))}
          </div>
        )}
        <span className="text-xs text-muted-foreground">{W}×{H}px</span>
      </div>

      {/* Preview iframe */}
      <div className="overflow-x-auto">
        <div style={{ width: W, minWidth: Math.min(W, 320) }}>
          {loaded ? (
            <iframe src={url} width={W} height={H}
              className="rounded-lg border bg-card block"
              style={{ width: W, height: Math.min(H, 600) }}
              sandbox="allow-scripts allow-same-origin allow-forms" />
          ) : (
            <div className="rounded-lg border bg-card/50 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2"
              style={{ width: W, height: Math.min(H, 600) }}>
              <div>{W}×{H}</div>
              <div className="text-xs opacity-60">Press Load to preview URL</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
