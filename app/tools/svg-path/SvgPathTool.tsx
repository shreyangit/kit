"use client";
import * as React from "react";

type Cmd = { type: string; args: number[] };

function parse(d: string): Cmd[] {
  const cmds: Cmd[] = [];
  const tokens = d.trim().match(/[MLHVCSQTAZmlhvcsqtaz][^MLHVCSQTAZmlhvcsqtaz]*/g) ?? [];
  for (const tok of tokens) {
    const type = tok[0];
    const args = tok.slice(1).trim().split(/[\s,]+/).filter(Boolean).map(Number);
    cmds.push({ type, args });
  }
  return cmds;
}

function simplify(d: string): string {
  return d.trim().replace(/\s+/g, ' ').replace(/,\s*/g, ' ').replace(/\s*([MLHVCSQTAZmlhvcsqtaz])\s*/g, '$1 ').trim();
}

function toAbsolute(cmds: Cmd[]): string {
  let x=0,y=0,startX=0,startY=0;
  return cmds.map(({type,args})=>{
    const t=type.toUpperCase();
    let out=t;
    switch(t){
      case'M':x=args[0];y=args[1];startX=x;startY=y;out=`M${x},${y}`;break;
      case'L':x=args[0];y=args[1];out=`L${x},${y}`;break;
      case'H':x=args[0];out=`H${x}`;break;
      case'V':y=args[0];out=`V${y}`;break;
      case'Z':x=startX;y=startY;out='Z';break;
      default:out=type.toUpperCase()+args.join(',');
    }
    return out;
  }).join(' ');
}

const EXAMPLES = [
  { label: 'Arrow', d: 'M 10 20 L 80 20 L 80 5 L 100 25 L 80 45 L 80 30 L 10 30 Z' },
  { label: 'Heart', d: 'M 50,30 C 50,15 30,0 20,15 C 10,30 30,45 50,70 C 70,45 90,30 80,15 C 70,0 50,15 50,30 Z' },
  { label: 'Star', d: 'M 50,5 L 61,35 L 98,35 L 68,57 L 79,91 L 50,70 L 21,91 L 32,57 L 2,35 L 39,35 Z' },
];

export function SvgPathTool() {
  const [path, setPath] = React.useState(EXAMPLES[2].d);
  const [fillColor, setFillColor] = React.useState('#e8e8ed33');
  const [strokeColor, setStrokeColor] = React.useState('#e8e8ed');
  const [strokeWidth, setStrokeWidth] = React.useState(1.5);
  const [copied, setCopied] = React.useState('');

  const cmds = React.useMemo(() => parse(path), [path]);
  const simplified = simplify(path);
  const absolute = toAbsolute(cmds);

  const copy = (text: string, key: string) => { navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1500); };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5">
        {EXAMPLES.map(ex => (
          <button key={ex.label} onClick={() => setPath(ex.d)}
            className="px-2.5 py-1 rounded-md text-xs font-medium border border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors">
            {ex.label}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-xs text-muted-foreground mb-1.5">SVG path data (d=&quot;…&quot;)</label>
        <textarea className="w-full h-20 rounded-md border bg-card px-3 py-2 font-mono text-xs outline-none focus:ring-1 focus:ring-ring resize-none"
          value={path} onChange={e => setPath(e.target.value)} />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {/* Preview */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Preview</label>
          <div className="w-full aspect-square rounded-lg border bg-card/30 flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 100 100" className="w-4/5 h-4/5">
              <path d={path} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
            </svg>
          </div>
          <div className="flex gap-3 mt-2">
            <div><label className="block text-xs text-muted-foreground mb-1">Fill</label>
              <input type="color" value={fillColor.slice(0,7)} onChange={e => setFillColor(e.target.value+'33')} className="h-7 w-16 rounded border border-border cursor-pointer" /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Stroke</label>
              <input type="color" value={strokeColor} onChange={e => setStrokeColor(e.target.value)} className="h-7 w-16 rounded border border-border cursor-pointer" /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Width: {strokeWidth}</label>
              <input type="range" min={0.5} max={5} step={0.5} value={strokeWidth} onChange={e => setStrokeWidth(+e.target.value)} className="w-20 accent-foreground" /></div>
          </div>
        </div>

        {/* Analysis */}
        <div className="space-y-3">
          <div className="rounded-lg border bg-card/50 p-3 space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Commands ({cmds.length})</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {cmds.map((c, i) => (
                <div key={i} className="flex gap-2 text-xs font-mono">
                  <span className="text-foreground font-bold w-4 shrink-0">{c.type}</span>
                  <span className="text-muted-foreground">{c.args.join(', ')}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {[{ label: 'Simplified', val: simplified, key: 'simple' }, { label: 'All absolute', val: absolute, key: 'abs' }].map(({ label, val, key }) => (
              <div key={key} className="rounded-lg border bg-card p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <button onClick={() => copy(val, key)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{copied === key ? 'Copied!' : 'Copy'}</button>
                </div>
                <div className="font-mono text-xs text-muted-foreground break-all">{val.slice(0, 120)}{val.length > 120 && '…'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
