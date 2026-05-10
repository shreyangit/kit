"use client";
import * as React from "react";

const PRESETS = [
  { label: 'Triangle', points: [{x:50,y:0},{x:100,y:100},{x:0,y:100}] },
  { label: 'Rhombus', points: [{x:50,y:0},{x:100,y:50},{x:50,y:100},{x:0,y:50}] },
  { label: 'Pentagon', points: [{x:50,y:0},{x:100,y:38},{x:81,y:100},{x:19,y:100},{x:0,y:38}] },
  { label: 'Hexagon', points: [{x:50,y:0},{x:100,y:25},{x:100,y:75},{x:50,y:100},{x:0,y:75},{x:0,y:25}] },
  { label: 'Arrow', points: [{x:0,y:20},{x:60,y:20},{x:60,y:0},{x:100,y:50},{x:60,y:100},{x:60,y:80},{x:0,y:80}] },
  { label: 'Star', points: [{x:50,y:0},{x:61,y:35},{x:98,y:35},{x:68,y:57},{x:79,y:91},{x:50,y:70},{x:21,y:91},{x:32,y:57},{x:2,y:35},{x:39,y:35}] },
];

export function ClipPathTool() {
  const [points, setPoints] = React.useState(PRESETS[0].points);
  const [dragging, setDragging] = React.useState<number | null>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [copied, setCopied] = React.useState(false);

  const polygonStr = points.map(p => `${p.x.toFixed(1)}% ${p.y.toFixed(1)}%`).join(', ');
  const clipPath = `polygon(${polygonStr})`;
  const css = `clip-path: ${clipPath};\n-webkit-clip-path: ${clipPath};`;

  function getSVGPos(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
    };
  }

  const copy = () => { navigator.clipboard.writeText(css); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div className="space-y-5">
      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => setPoints(p.points)}
            className="px-2.5 py-1 rounded-md text-xs font-medium border border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors">
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {/* SVG canvas */}
        <div>
          <div className="text-xs text-muted-foreground mb-1.5">Drag handles to edit shape</div>
          <svg ref={svgRef} viewBox="0 0 100 100" className="w-full rounded-lg border bg-card/30 aspect-square cursor-crosshair touch-none"
            onMouseMove={e => { if (dragging === null) return; const pos = getSVGPos(e); setPoints(prev => prev.map((p, i) => i === dragging ? pos : p)); }}
            onMouseUp={() => setDragging(null)}>
            <polygon points={points.map(p => `${p.x},${p.y}`).join(' ')} fill="hsl(0 0% 100% / 0.08)" stroke="hsl(0 0% 100% / 0.4)" strokeWidth="0.5" />
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="3" fill="hsl(0 0% 100% / 0.9)" stroke="hsl(0 0% 0% / 0.3)" strokeWidth="0.5"
                className="cursor-move" onMouseDown={e => { e.preventDefault(); setDragging(i); }} />
            ))}
          </svg>
        </div>

        {/* Preview + output */}
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground mb-1.5">Preview</div>
          <div className="w-full rounded-lg overflow-hidden aspect-square" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="w-full h-full bg-card/90 flex items-center justify-center text-sm text-muted-foreground"
              style={{ clipPath, WebkitClipPath: clipPath }}>
              Clipped element
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground">CSS output</label>
              <button onClick={copy} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{copied ? 'Copied!' : 'Copy'}</button>
            </div>
            <pre className="rounded-lg border bg-card p-3 font-mono text-xs overflow-x-auto">{css}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
