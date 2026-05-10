"use client";
import * as React from "react";

function hslToRgb(h:number,s:number,l:number):[number,number,number]{
  s/=100;l/=100;const k=(n:number)=>(n+h/30)%12;const a=s*Math.min(l,1-l);
  const f=(n:number)=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));
  return [Math.round(f(0)*255),Math.round(f(8)*255),Math.round(f(4)*255)];
}
function rgbHex(r:number,g:number,b:number){return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;}

const SCHEMES: Record<string,(h:number)=>number[]> = {
  Analogous: h=>[h,h+30,h-30],
  Complementary: h=>[h,h+180],
  Triadic: h=>[h,h+120,h+240],
  Tetradic: h=>[h,h+90,h+180,h+270],
  'Split-complementary': h=>[h,h+150,h+210],
  Monochromatic: h=>[h,h,h,h,h],
};

export function GradientMeshTool() {
  const [baseH, setBaseH] = React.useState(240);
  const [scheme, setScheme] = React.useState('Triadic');
  const [saturation, setSaturation] = React.useState(70);
  const [lightness, setLightness] = React.useState(60);
  const [cols, setCols] = React.useState(3);
  const [rows, setRows] = React.useState(3);
  const [copied, setCopied] = React.useState('');

  const hues = SCHEMES[scheme](baseH).map(h => ((h % 360) + 360) % 360);
  const colors = hues.map((h, i) => {
    const offset = i * (30 / hues.length);
    return hslToRgb(h, saturation, lightness + offset);
  });

  const gridColors: string[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: string[] = [];
    for (let c = 0; c < cols; c++) {
      const t = (r * cols + c) / (rows * cols - 1);
      const ci = Math.min(Math.floor(t * (colors.length - 1)), colors.length - 2);
      const lerp = t * (colors.length - 1) - ci;
      const [r1,g1,b1] = colors[ci]; const [r2,g2,b2] = colors[ci+1] ?? colors[ci];
      row.push(rgbHex(Math.round(r1+(r2-r1)*lerp),Math.round(g1+(g2-g1)*lerp),Math.round(b1+(b2-b1)*lerp)));
    }
    gridColors.push(row);
  }

  const cssGrad = `background: conic-gradient(${colors.map(([r,g,b],i)=>`${rgbHex(r,g,b)} ${Math.round(i/colors.length*360)}deg`).join(', ')});`;
  const meshCss = `background-image: radial-gradient(at 0% 0%, ${rgbHex(...colors[0])} 0%, transparent 60%), radial-gradient(at 100% 0%, ${rgbHex(...(colors[1]??colors[0]))} 0%, transparent 60%), radial-gradient(at 100% 100%, ${rgbHex(...(colors[2]??colors[0]))} 0%, transparent 60%), radial-gradient(at 0% 100%, ${rgbHex(...(colors[3]??colors[0]))} 0%, transparent 60%);`;

  const copy = (text: string, key: string) => { navigator.clipboard.writeText(text); setCopied(key); setTimeout(()=>setCopied(''),1500); };

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Controls */}
        <div className="space-y-4">
          <div><label className="block text-xs text-muted-foreground mb-1">Base hue: {baseH}°</label>
            <input type="range" min={0} max={360} value={baseH} onChange={e=>setBaseH(+e.target.value)} className="w-full accent-foreground" /></div>
          <div><label className="block text-xs text-muted-foreground mb-1">Saturation: {saturation}%</label>
            <input type="range" min={20} max={100} value={saturation} onChange={e=>setSaturation(+e.target.value)} className="w-full accent-foreground" /></div>
          <div><label className="block text-xs text-muted-foreground mb-1">Lightness: {lightness}%</label>
            <input type="range" min={20} max={80} value={lightness} onChange={e=>setLightness(+e.target.value)} className="w-full accent-foreground" /></div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Colour scheme</label>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(SCHEMES).map(s=>(
                <button key={s} onClick={()=>setScheme(s)}
                  className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${scheme===s?'bg-foreground text-background border-foreground':'border-border text-muted-foreground hover:border-foreground/30'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <div><label className="block text-xs text-muted-foreground mb-1">Grid cols: {cols}</label>
              <input type="range" min={2} max={5} value={cols} onChange={e=>setCols(+e.target.value)} className="w-20 accent-foreground" /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Grid rows: {rows}</label>
              <input type="range" min={2} max={5} value={rows} onChange={e=>setRows(+e.target.value)} className="w-20 accent-foreground" /></div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">Mesh gradient preview</div>
          <div className="w-full rounded-lg h-48 border" style={{ backgroundImage: meshCss.replace('background-image:','').replace(';','').trim() }} />
          <div>
            <div className="text-xs text-muted-foreground mb-2">Colour grid</div>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
              {gridColors.flat().map((c,i) => (
                <button key={i} onClick={() => copy(c, c)} className="h-8 rounded border border-border/30 text-xs font-mono transition-transform hover:scale-105" style={{background:c}} title={c}>
                  {copied===c?'✓':''}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            {[{label:'CSS Mesh', val:meshCss, key:'mesh'},{label:'Conic', val:cssGrad, key:'conic'}].map(({label,val,key})=>(
              <div key={key} className="rounded-lg border bg-card p-2.5 flex items-start justify-between gap-2">
                <div className="font-mono text-xs text-muted-foreground flex-1 truncate">{val.slice(0,80)}…</div>
                <button onClick={()=>copy(val,key)} className="text-xs text-muted-foreground hover:text-foreground shrink-0">{copied===key?'Copied!':label}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
