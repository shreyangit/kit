"use client";
import * as React from "react";

const MATRICES: Record<string, number[]> = {
  protanopia: [0.152,1.053,-0.205,0.115,0.786,0.099,-0.004,-0.048,1.052],
  deuteranopia: [0.367,0.861,-0.228,0.280,0.673,0.047,-0.012,0.043,0.969],
  tritanopia: [1.256,-0.077,-0.179,-0.078,0.931,0.148,0.005,0.691,0.304],
  achromatopsia: [0.213,0.715,0.072,0.213,0.715,0.072,0.213,0.715,0.072],
};
function lin(c:number){const n=c/255;return n<=0.04045?n/12.92:Math.pow((n+0.055)/1.055,2.4);}
function delin(c:number){return Math.round(255*(c<=0.0031308?12.92*c:1.055*Math.pow(c,1/2.4)-0.055));}

// Simple median-cut colour extraction
function extractPalette(imageData: ImageData, count: number): string[] {
  const pixels: [number,number,number][] = [];
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4*8) { // sample every 8th pixel
    if (d[i+3] > 128) pixels.push([d[i], d[i+1], d[i+2]]);
  }
  // Quantise to 16-step grid
  const map = new Map<string,number>();
  for (const [r,g,b] of pixels) {
    const key = `${Math.round(r/16)*16},${Math.round(g/16)*16},${Math.round(b/16)*16}`;
    map.set(key, (map.get(key)||0)+1);
  }
  const sorted = [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,count);
  return sorted.map(([k]) => { const [r,g,b]=k.split(',').map(Number); return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`; });
}

export function PaletteAdvancedTool() {
  const [palette, setPalette] = React.useState<string[]>([]);
  const [processing, setProcessing] = React.useState(false);
  const [swatches, setSwatches] = React.useState(12);
  const [dragging, setDragging] = React.useState(false);
  const [copied, setCopied] = React.useState('');

  async function process(file: File) {
    setProcessing(true);
    const img = new Image();
    const url = URL.createObjectURL(file);
    await new Promise<void>((res,rej) => { img.onload=()=>res(); img.onerror=rej; img.src=url; });
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 200/Math.max(img.naturalWidth,img.naturalHeight));
    canvas.width=Math.round(img.naturalWidth*scale); canvas.height=Math.round(img.naturalHeight*scale);
    canvas.getContext('2d')!.drawImage(img,0,0,canvas.width,canvas.height);
    const imageData = canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height);
    URL.revokeObjectURL(url);
    setPalette(extractPalette(imageData, swatches));
    setProcessing(false);
  }

  const copy = (hex: string) => { navigator.clipboard.writeText(hex); setCopied(hex); setTimeout(()=>setCopied(''),1500); };
  const copyAll = () => { navigator.clipboard.writeText(palette.join('\n')); setCopied('all'); setTimeout(()=>setCopied(''),1500); };

  return (
    <div className="space-y-5">
      <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)}
        onDrop={e=>{e.preventDefault();setDragging(false);const f=e.dataTransfer.files[0];if(f?.type.startsWith('image/'))process(f);}}
        onClick={()=>{const i=document.createElement('input');i.type='file';i.accept='image/*';i.onchange=()=>{if(i.files?.[0])process(i.files[0]);};i.click();}}
        className={`rounded-lg border-2 border-dashed p-12 text-center cursor-pointer transition-colors ${dragging?'border-foreground/50 bg-foreground/5':'border-border hover:border-foreground/30'}`}>
        <div className="text-sm text-muted-foreground">Drop an image to extract its colour palette</div>
        <div className="text-xs text-muted-foreground mt-1">Supports PNG, JPG, WebP</div>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-xs text-muted-foreground">Swatches: {swatches}</label>
        <input type="range" min={4} max={24} value={swatches} onChange={e=>setSwatches(+e.target.value)} className="w-32 accent-foreground" />
      </div>
      {processing && <div className="text-center text-sm text-muted-foreground py-8">Extracting palette…</div>}
      {palette.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">{palette.length} colours extracted</div>
            <button onClick={copyAll} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{copied==='all'?'Copied!':'Copy all'}</button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {palette.map(hex => (
              <button key={hex} onClick={()=>copy(hex)} className="group space-y-1.5">
                <div className="w-full rounded-lg border border-border/50 aspect-square transition-transform group-hover:scale-105" style={{background:hex}} />
                <div className="text-xs font-mono text-center text-muted-foreground">{copied===hex?'Copied!':hex}</div>
              </button>
            ))}
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xs text-muted-foreground mb-2">CSS gradient preview</div>
            <div className="h-12 rounded" style={{background:`linear-gradient(to right, ${palette.join(',')})`}} />
          </div>
        </div>
      )}
    </div>
  );
}
