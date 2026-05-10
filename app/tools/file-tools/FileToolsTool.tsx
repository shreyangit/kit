"use client";
import * as React from "react";

interface FileInfo { name: string; size: number; type: string; lastModified: number; ext: string; newName?: string; }
type Pattern = 'sequence' | 'date-prefix' | 'lowercase' | 'replace' | 'strip-spaces' | 'add-prefix' | 'add-suffix';

function fmt(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

function rename(files: FileInfo[], pattern: Pattern, opts: Record<string, string>): FileInfo[] {
  return files.map((f, i) => {
    const ext = f.ext ? `.${f.ext}` : '';
    const base = f.name.slice(0, f.name.length - ext.length);
    let newBase = base;
    switch (pattern) {
      case 'sequence': newBase = `${opts.prefix || 'file'}_${String(i + 1).padStart(3, '0')}`; break;
      case 'date-prefix': newBase = `${new Date(f.lastModified).toISOString().split('T')[0]}_${base}`; break;
      case 'lowercase': newBase = base.toLowerCase(); break;
      case 'replace': newBase = base.replaceAll(opts.find || '', opts.replace || ''); break;
      case 'strip-spaces': newBase = base.replace(/\s+/g, opts.sep || '_'); break;
      case 'add-prefix': newBase = `${opts.prefix || ''}${base}`; break;
      case 'add-suffix': newBase = `${base}${opts.suffix || ''}`; break;
    }
    return { ...f, newName: `${newBase}${ext}` };
  });
}

export function FileToolsTool() {
  const [files, setFiles] = React.useState<FileInfo[]>([]);
  const [pattern, setPattern] = React.useState<Pattern>('lowercase');
  const [opts, setOpts] = React.useState<Record<string, string>>({ prefix: 'photo', sep: '_' });
  const [dragging, setDragging] = React.useState(false);

  function handleFiles(fileList: FileList) {
    setFiles(Array.from(fileList).map(f => ({
      name: f.name, size: f.size, type: f.type || 'unknown',
      lastModified: f.lastModified, ext: f.name.split('.').pop()?.toLowerCase() ?? '',
    })));
  }

  const renamed = React.useMemo(() => rename(files, pattern, opts), [files, pattern, opts]);
  const totalSize = files.reduce((s, f) => s + f.size, 0);
  const byType = files.reduce((acc, f) => { const t = f.ext || 'other'; acc[t] = (acc[t] || 0) + 1; return acc; }, {} as Record<string, number>);

  const PATTERNS: { id: Pattern; label: string }[] = [
    { id: 'lowercase', label: 'Lowercase' }, { id: 'strip-spaces', label: 'Strip spaces' },
    { id: 'add-prefix', label: 'Add prefix' }, { id: 'add-suffix', label: 'Add suffix' },
    { id: 'sequence', label: 'Sequence' }, { id: 'date-prefix', label: 'Date prefix' },
    { id: 'replace', label: 'Find & Replace' },
  ];

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
        onClick={() => { const i = document.createElement('input'); i.type = 'file'; i.multiple = true; i.onchange = () => { if (i.files) handleFiles(i.files); }; i.click(); }}
        className={`rounded-lg border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${dragging ? 'border-foreground/50 bg-foreground/5' : 'border-border hover:border-foreground/30'}`}>
        <div className="text-sm text-muted-foreground">Drop files here or click to choose</div>
        <div className="text-xs text-muted-foreground mt-1">Multiple files supported</div>
      </div>

      {files.length > 0 && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border bg-card p-3"><div className="text-xs text-muted-foreground mb-1">Total files</div><div className="text-xl font-bold">{files.length}</div></div>
            <div className="rounded-lg border bg-card p-3"><div className="text-xs text-muted-foreground mb-1">Total size</div><div className="text-xl font-bold">{fmt(totalSize)}</div></div>
            <div className="rounded-lg border bg-card p-3"><div className="text-xs text-muted-foreground mb-1">Types</div><div className="text-sm font-mono font-medium">{Object.entries(byType).map(([t, n]) => `${t}(${n})`).join(', ')}</div></div>
          </div>

          {/* Rename pattern */}
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">Batch rename</div>
            <div className="flex flex-wrap gap-1.5">
              {PATTERNS.map(p => (
                <button key={p.id} onClick={() => setPattern(p.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${pattern === p.id ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:border-foreground/30'}`}>
                  {p.label}
                </button>
              ))}
            </div>
            {(pattern === 'add-prefix' || pattern === 'sequence') && (
              <input className="rounded-md border bg-card px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-ring"
                placeholder="Prefix text" value={opts.prefix || ''} onChange={e => setOpts(o => ({ ...o, prefix: e.target.value }))} />
            )}
            {pattern === 'add-suffix' && (
              <input className="rounded-md border bg-card px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-ring"
                placeholder="Suffix text" value={opts.suffix || ''} onChange={e => setOpts(o => ({ ...o, suffix: e.target.value }))} />
            )}
            {pattern === 'replace' && (
              <div className="flex gap-2">
                <input className="flex-1 rounded-md border bg-card px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-ring" placeholder="Find" value={opts.find || ''} onChange={e => setOpts(o => ({ ...o, find: e.target.value }))} />
                <input className="flex-1 rounded-md border bg-card px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-ring" placeholder="Replace with" value={opts.replace || ''} onChange={e => setOpts(o => ({ ...o, replace: e.target.value }))} />
              </div>
            )}
          </div>

          {/* File table */}
          <div className="rounded-lg border bg-card/50 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b"><th className="text-left p-3 text-muted-foreground">Original</th><th className="text-left p-3 text-muted-foreground">New name</th><th className="p-3 text-muted-foreground text-right">Size</th></tr></thead>
              <tbody>
                {renamed.map((f, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="p-3 font-mono text-muted-foreground truncate max-w-xs">{f.name}</td>
                    <td className="p-3 font-mono font-medium truncate max-w-xs">{f.newName}</td>
                    <td className="p-3 text-right text-muted-foreground">{fmt(f.size)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">Note: Actual file renaming happens in your filesystem. This tool shows a preview of the new names. Download renamed files requires server-side support.</p>
        </>
      )}
    </div>
  );
}
