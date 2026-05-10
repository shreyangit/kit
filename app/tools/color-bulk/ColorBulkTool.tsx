"use client";
import * as React from "react";

function hexToRgb(hex: string): [number,number,number] | null {
  const m = hex.replace('#','').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  return m ? [parseInt(m[1],16),parseInt(m[2],16),parseInt(m[3],16)] : null;
}
function rgbToHsl(r:number,g:number,b:number): [number,number,number] {
  r/=255;g/=255;b/=255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b);
  let h=0,s=0,l=(max+min)/2;
  if(max!==min){const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);
  h=max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4;h/=6;}
  return [Math.round(h*360),Math.round(s*100),Math.round(l*100)];
}

const FORMATS = ['hex','rgb','hsl','oklch'] as const;
type Fmt = typeof FORMATS[number];

export function ColorBulkTool() {
  const [input, setInput] = React.useState('#1a1a2e\n#16213e\n#0f3460\n#e94560\nrgb(255,100,50)\nhsl(200,80%,50%)');
  const [outFmt, setOutFmt] = React.useState<Fmt>('rgb');
  const [copied, setCopied] = React.useState(false);

  const results = React.useMemo(() => {
    return input.split('\n').map(raw => {
      const line = raw.trim();
      if (!line) return null;
      let r=0,g=0,b=0,ok=false;
      // Parse hex
      if (/^#?[0-9a-f]{3,6}$/i.test(line)) {
        const h = line.startsWith('#') ? line : '#'+line;
        const rgb = hexToRgb(h.length===4 ? '#'+h[1]+h[1]+h[2]+h[2]+h[3]+h[3] : h);
        if (rgb) { [r,g,b]=rgb; ok=true; }
      }
      // Parse rgb()
      else if (/^rgb\s*\(/i.test(line)) {
        const m = line.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
        if (m) { r=+m[1];g=+m[2];b=+m[3]; ok=true; }
      }
      if (!ok) return { original: line, error: 'Cannot parse', output: '', hex: '' };
      const hex = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
      const [h,s,l] = rgbToHsl(r,g,b);
      const outputs: Record<Fmt,string> = {
        hex, rgb: `rgb(${r}, ${g}, ${b})`, hsl: `hsl(${h}, ${s}%, ${l}%)`,
        oklch: `oklch(${(l/100).toFixed(2)} ${(s/100*0.4).toFixed(3)} ${h})`,
      };
      return { original: line, error: null, output: outputs[outFmt], hex };
    }).filter(Boolean);
  }, [input, outFmt]);

  const outputText = results.map(r => r?.output || `/* error: ${r?.original} */`).join('\n');
  const copy = () => { navigator.clipboard.writeText(outputText); setCopied(true); setTimeout(()=>setCopied(false),1500); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FORMATS.map(f => (
          <button key={f} onClick={() => setOutFmt(f)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${outFmt===f?'bg-foreground text-background border-foreground':'border-border text-muted-foreground hover:border-foreground/30'}`}>
            {f.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Input colours (one per line, hex or rgb)</label>
          <textarea className="w-full h-64 rounded-md border bg-card px-3 py-2 font-mono text-xs outline-none focus:ring-1 focus:ring-ring resize-none"
            value={input} onChange={e => setInput(e.target.value)} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-muted-foreground">Output ({outFmt.toUpperCase()})</label>
            <button onClick={copy} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{copied?'Copied!':'Copy all'}</button>
          </div>
          <div className="h-64 rounded-md border bg-card overflow-y-auto">
            {results.map((r,i) => r && (
              <div key={i} className={`flex items-center gap-2 px-3 py-1.5 border-b border-border last:border-0 ${r.error ? 'opacity-50' : ''}`}>
                {!r.error && <div className="w-5 h-5 rounded shrink-0 border border-border/50" style={{background:r.hex}} />}
                <span className="font-mono text-xs flex-1 truncate">{r.error ? r.error : r.output}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
