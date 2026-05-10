"use client";
import * as React from "react";

async function parseDataURL(dataURL: string) {
  const match = dataURL.match(/^data:([^;]+)(?:;([^,]+))?,(.+)$/);
  if (!match) return { valid: false, error: 'Not a valid data URL. Expected: data:[mediatype][;base64],data' };
  const [, mime, enc, data] = match;
  const isBase64 = enc === 'base64';
  const estSize = isBase64
    ? Math.round(data.length * 3 / 4) - (data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0)
    : data.length;
  const MIME_EXT: Record<string, string> = {
    'image/jpeg':'jpg','image/png':'png','image/gif':'gif','image/webp':'webp','image/svg+xml':'svg',
    'text/plain':'txt','text/html':'html','text/css':'css','application/json':'json','application/pdf':'pdf',
    'audio/mpeg':'mp3','video/mp4':'mp4',
  };
  const preview = mime?.startsWith('image/') ? 'image' : mime?.startsWith('text/') ? 'text' : mime?.startsWith('audio/') ? 'audio' : 'other';
  return { valid: true, mime, enc: enc ?? 'url-encoded', data, isBase64, estSize, ext: MIME_EXT[mime] ?? mime?.split('/')[1] ?? 'bin', preview };
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function fmt(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function DataUrlTool() {
  const [tab, setTab] = React.useState<'encode' | 'decode'>('encode');
  const [result, setResult] = React.useState('');
  const [info, setInfo] = React.useState<Awaited<ReturnType<typeof parseDataURL>> | null>(null);
  const [decodeInput, setDecodeInput] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);

  async function handleFile(file: File) {
    const url = await fileToDataURL(file);
    setResult(url);
    const overhead = Math.round(((url.length - file.size) / file.size) * 100);
    setInfo({ valid: true, mime: file.type, enc: 'base64', data: url.split(',')[1], isBase64: true, estSize: url.length, ext: file.name.split('.').pop() ?? 'bin', preview: file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'other', overhead } as any);
  }

  async function handleDecode() {
    const r = await parseDataURL(decodeInput.trim());
    setInfo(r as any);
  }

  function download() {
    if (!info || !('data' in info) || !info.valid) return;
    const i = info as any;
    const byteStr = i.isBase64 ? atob(i.data) : decodeURIComponent(i.data);
    const bytes = new Uint8Array(byteStr.length).map((_, j) => byteStr.charCodeAt(j));
    const blob = new Blob([bytes], { type: i.mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `decoded.${i.ext}`;
    a.click();
  }

  function copy() { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 1500); }

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {(['encode', 'decode'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setResult(''); setInfo(null); }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${tab === t ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:border-foreground/30'}`}>
            {t === 'encode' ? 'File → Data URL' : 'Data URL → File'}
          </button>
        ))}
      </div>

      {tab === 'encode' ? (
        <>
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => { const i = document.createElement('input'); i.type = 'file'; i.onchange = () => { if (i.files?.[0]) handleFile(i.files[0]); }; i.click(); }}
            className={`rounded-lg border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${dragging ? 'border-foreground/50 bg-foreground/5' : 'border-border hover:border-foreground/30'}`}>
            <div className="text-sm text-muted-foreground">Drop a file here or click to choose</div>
          </div>

          {result && (
            <div className="space-y-3">
              <div className="rounded-lg border bg-card p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Data URL ({fmt(result.length)})</span>
                  {(info as any)?.overhead && <span className="text-xs text-muted-foreground">+{(info as any).overhead}% overhead</span>}
                </div>
                <div className="font-mono text-xs break-all text-muted-foreground bg-muted/30 rounded p-2 max-h-32 overflow-auto">{result.slice(0, 200)}…</div>
              </div>
              {(info as any)?.estSize > 1024 * 1024 && (
                <div className="text-xs text-amber-500 border border-amber-500/30 rounded-lg p-3">
                  Large data URLs (&gt;1MB) cause performance issues in HTML. Consider hosting the file separately.
                </div>
              )}
              <button onClick={copy} className="px-4 py-2 rounded-md text-sm font-medium bg-foreground text-background hover:opacity-90 transition-opacity">
                {copied ? 'Copied!' : 'Copy Data URL'}
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Paste a data URL</label>
            <textarea className="w-full h-32 rounded-md border bg-card px-3 py-2 font-mono text-xs outline-none focus:ring-1 focus:ring-ring resize-none"
              value={decodeInput} onChange={e => setDecodeInput(e.target.value)} placeholder="data:image/png;base64,iVBOR..." />
          </div>
          <button onClick={handleDecode} className="px-4 py-2 rounded-md text-sm font-medium bg-foreground text-background hover:opacity-90 transition-opacity">
            Parse & Preview
          </button>
          {info && (info as any).valid && (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-3 gap-3">
                {[['MIME type', (info as any).mime], ['Encoding', (info as any).enc], ['Est. file size', fmt((info as any).estSize)]].map(([l, v]) => (
                  <div key={l} className="rounded-lg border bg-card p-3"><div className="text-xs text-muted-foreground mb-1">{l}</div><div className="font-mono text-sm">{v}</div></div>
                ))}
              </div>
              {(info as any).preview === 'image' && (
                <img src={decodeInput.trim()} alt="Preview" className="max-w-full max-h-64 rounded-lg border object-contain" />
              )}
              {(info as any).preview === 'audio' && <audio src={decodeInput.trim()} controls className="w-full" />}
              <button onClick={download} className="px-4 py-2 rounded-md text-sm font-medium border border-border hover:border-foreground/30 transition-colors">
                Download .{(info as any).ext}
              </button>
            </div>
          )}
          {info && !(info as any).valid && (
            <div className="text-sm text-red-400 border border-red-500/30 rounded-lg p-3">{(info as any).error}</div>
          )}
        </>
      )}
    </div>
  );
}
