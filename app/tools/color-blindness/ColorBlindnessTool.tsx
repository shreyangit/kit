"use client";
import * as React from "react";

const MATRICES: Record<string, number[]> = {
  protanopia:    [0.152, 1.053, -0.205, 0.115, 0.786, 0.099, -0.004, -0.048, 1.052],
  deuteranopia:  [0.367, 0.861, -0.228, 0.280, 0.673, 0.047, -0.012, 0.043, 0.969],
  tritanopia:    [1.256, -0.077, -0.179, -0.078, 0.931, 0.148, 0.005, 0.691, 0.304],
  achromatopsia: [0.213, 0.715, 0.072, 0.213, 0.715, 0.072, 0.213, 0.715, 0.072],
};

function linearise(c: number) { const n = c / 255; return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4); }
function delinearise(c: number) { return Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055)); }

function applyMatrix(imageData: ImageData, m: number[]): ImageData {
  const d = new Uint8ClampedArray(imageData.data);
  for (let i = 0; i < d.length; i += 4) {
    const r = linearise(d[i]), g = linearise(d[i + 1]), b = linearise(d[i + 2]);
    d[i]     = Math.max(0, Math.min(255, delinearise(m[0]*r + m[1]*g + m[2]*b)));
    d[i + 1] = Math.max(0, Math.min(255, delinearise(m[3]*r + m[4]*g + m[5]*b)));
    d[i + 2] = Math.max(0, Math.min(255, delinearise(m[6]*r + m[7]*g + m[8]*b)));
  }
  return new ImageData(d, imageData.width, imageData.height);
}

const TYPES = [
  { id: 'normal', label: 'Normal', prev: '~95%' },
  { id: 'protanopia', label: 'Protanopia', prev: '~1% males' },
  { id: 'deuteranopia', label: 'Deuteranopia', prev: '~1% males' },
  { id: 'tritanopia', label: 'Tritanopia', prev: '<0.01%' },
  { id: 'achromatopsia', label: 'Achromatopsia', prev: '~0.003%' },
];

export function ColorBlindnessTool() {
  const [imgUrl, setImgUrl] = React.useState<string | null>(null);
  const [canvases, setCanvases] = React.useState<Record<string, string>>({});
  const [processing, setProcessing] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);

  async function processImage(file: File) {
    setProcessing(true);
    const url = URL.createObjectURL(file);
    const img = new Image();
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = url; });
    const scale = Math.min(1, 600 / Math.max(img.naturalWidth, img.naturalHeight));
    const W = Math.round(img.naturalWidth * scale), H = Math.round(img.naturalHeight * scale);
    const src = document.createElement('canvas');
    src.width = W; src.height = H;
    src.getContext('2d')!.drawImage(img, 0, 0, W, H);
    const srcData = src.getContext('2d')!.getImageData(0, 0, W, H);
    const results: Record<string, string> = {};
    for (const t of TYPES) {
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d')!;
      if (t.id === 'normal') { ctx.drawImage(img, 0, 0, W, H); }
      else { const processed = applyMatrix(srcData, MATRICES[t.id]); ctx.putImageData(processed, 0, 0); }
      results[t.id] = canvas.toDataURL();
      await new Promise(r => setTimeout(r, 0));
    }
    URL.revokeObjectURL(url);
    setImgUrl(results.normal);
    setCanvases(results);
    setProcessing(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith('image/')) processImage(f);
  }

  function pickFile() {
    const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*';
    i.onchange = () => { if (i.files?.[0]) processImage(i.files[0]); }; i.click();
  }

  const download = (id: string) => {
    const a = document.createElement('a'); a.href = canvases[id]; a.download = `${id}.png`; a.click();
  };

  return (
    <div className="space-y-5">
      {!imgUrl ? (
        <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop} onClick={pickFile}
          className={`rounded-lg border-2 border-dashed p-16 text-center cursor-pointer transition-colors ${dragging ? 'border-foreground/50 bg-foreground/5' : 'border-border hover:border-foreground/30'}`}>
          <div className="text-sm text-muted-foreground">Drop an image here or click to choose</div>
          <div className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP supported</div>
        </div>
      ) : processing ? (
        <div className="text-center text-muted-foreground text-sm py-12">Processing colour blindness simulations…</div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">Showing how your image looks under different types of colour vision deficiency. Click a simulation to download.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TYPES.map(t => canvases[t.id] && (
              <div key={t.id} className="rounded-lg border bg-card overflow-hidden">
                <img src={canvases[t.id]} alt={t.label} className="w-full object-cover" />
                <div className="p-2 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium">{t.label}</div>
                    <div className="text-xs text-muted-foreground">{t.prev}</div>
                  </div>
                  <button onClick={() => download(t.id)} className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 border border-border rounded">
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={pickFile} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Try another image</button>
        </>
      )}
    </div>
  );
}
