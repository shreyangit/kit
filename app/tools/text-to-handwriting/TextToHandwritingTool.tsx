"use client";
import * as React from "react";

const HANDWRITING_FONTS = [
  'Caveat', 'Indie Flower', 'Patrick Hand', 'Shadows Into Light', 'Kalam',
];

async function loadFont(name: string) {
  const id = `gf-${name.replace(/\s/g, '-')}`;
  if (document.getElementById(id)) return;
  await new Promise<void>((resolve) => {
    const link = document.createElement('link');
    link.id = id; link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}&display=swap`;
    link.onload = () => resolve();
    document.head.appendChild(link);
  });
  await document.fonts.load(`24px "${name}"`).catch(() => {});
}

export function TextToHandwritingTool() {
  const [text, setText] = React.useState("The quick brown fox jumps over the lazy dog.\n\nThis is a handwriting simulation tool.\nType anything and see it rendered as handwriting.");
  const [font, setFont] = React.useState('Caveat');
  const [fontSize, setFontSize] = React.useState(32);
  const [lineHeight, setLineHeight] = React.useState(1.8);
  const [inkColor, setInkColor] = React.useState('#1a1a2e');
  const [bgColor, setBgColor] = React.useState('#fffff0');
  const [pageStyle, setPageStyle] = React.useState<'blank' | 'lined' | 'ruled'>('lined');
  const [variation, setVariation] = React.useState(3);
  const [downloading, setDownloading] = React.useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const render = React.useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    await loadFont(font);
    const W = 800, H = 600;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);
    const spacing = fontSize * lineHeight;
    if (pageStyle === 'lined' || pageStyle === 'ruled') {
      ctx.strokeStyle = '#b0c4de40'; ctx.lineWidth = 1;
      for (let y = spacing + 30; y < H; y += spacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
    }
    if (pageStyle === 'ruled') {
      ctx.strokeStyle = '#ff000030'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(70, 0); ctx.lineTo(70, H); ctx.stroke();
    }
    ctx.fillStyle = inkColor;
    ctx.font = `${fontSize}px "${font}"`;
    const marginLeft = pageStyle === 'ruled' ? 80 : 40;
    const maxWidth = W - marginLeft - 40;
    const paragraphs = text.split('\n');
    const lines: string[] = [];
    for (const para of paragraphs) {
      if (!para.trim()) { lines.push(''); continue; }
      const words = para.split(' ');
      let cur = '';
      for (const word of words) {
        const test = cur + (cur ? ' ' : '') + word;
        if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur); cur = word; }
        else cur = test;
      }
      if (cur) lines.push(cur);
    }
    lines.forEach((line, li) => {
      const baseY = 30 + (li + 1) * spacing;
      if (baseY > H - 20) return;
      let x = marginLeft;
      for (const char of line) {
        const jx = (Math.random() - 0.5) * variation;
        const jy = (Math.random() - 0.5) * variation;
        const ja = (Math.random() - 0.5) * (variation * 0.015);
        ctx.save();
        ctx.translate(x + jx, baseY + jy);
        ctx.rotate(ja);
        ctx.fillText(char, 0, 0);
        ctx.restore();
        x += ctx.measureText(char).width + (Math.random() - 0.5) * variation * 0.3;
      }
    });
  }, [text, font, fontSize, lineHeight, inkColor, bgColor, pageStyle, variation]);

  React.useEffect(() => { const t = setTimeout(() => render(), 200); return () => clearTimeout(t); }, [render]);

  const download = async () => {
    setDownloading(true);
    await render();
    canvasRef.current?.toBlob(blob => {
      if (!blob) return;
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'handwriting.png'; a.click();
      setDownloading(false);
    }, 'image/png');
  };

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Text</label>
            <textarea className="w-full h-32 rounded-md border bg-card px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring resize-none"
              value={text} onChange={e => setText(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Font</label>
            <div className="flex flex-wrap gap-1.5">
              {HANDWRITING_FONTS.map(f => (
                <button key={f} onClick={() => setFont(f)}
                  className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${font === f ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:border-foreground/30'}`}
                  style={{ fontFamily: f }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-muted-foreground mb-1">Font size: {fontSize}px</label>
              <input type="range" min={18} max={52} value={fontSize} onChange={e => setFontSize(+e.target.value)} className="w-full accent-foreground" /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Variation: {variation}</label>
              <input type="range" min={0} max={8} value={variation} onChange={e => setVariation(+e.target.value)} className="w-full accent-foreground" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-muted-foreground mb-1">Ink colour</label>
              <input type="color" value={inkColor} onChange={e => setInkColor(e.target.value)} className="h-8 w-full rounded border border-border cursor-pointer" /></div>
            <div><label className="block text-xs text-muted-foreground mb-1">Paper colour</label>
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="h-8 w-full rounded border border-border cursor-pointer" /></div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Page style</label>
            <div className="flex gap-1.5">
              {(['blank', 'lined', 'ruled'] as const).map(s => (
                <button key={s} onClick={() => setPageStyle(s)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors capitalize ${pageStyle === s ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:border-foreground/30'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <button onClick={download} disabled={downloading}
            className="w-full px-4 py-2 rounded-md text-sm font-medium bg-foreground text-background hover:opacity-90 disabled:opacity-50 transition-opacity">
            {downloading ? 'Generating…' : 'Download PNG'}
          </button>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Preview</label>
          <canvas ref={canvasRef} className="w-full rounded-lg border bg-card" style={{ maxWidth: '100%', height: 'auto' }} />
        </div>
      </div>
    </div>
  );
}
