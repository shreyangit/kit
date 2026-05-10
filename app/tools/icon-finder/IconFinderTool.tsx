"use client";
import * as React from "react";

const ICONIFY_SETS = [
  { prefix: 'mdi', name: 'Material Design Icons' }, { prefix: 'heroicons', name: 'Heroicons' },
  { prefix: 'tabler', name: 'Tabler Icons' }, { prefix: 'lucide', name: 'Lucide' },
  { prefix: 'ph', name: 'Phosphor Icons' }, { prefix: 'ri', name: 'Remix Icon' },
];

interface IconResult { id: string; prefix: string; name: string; svg: string; }

async function searchIcons(query: string, prefix?: string): Promise<IconResult[]> {
  const params = new URLSearchParams({ query, limit: '36', ...(prefix ? { prefixes: prefix } : {}) });
  const res = await fetch(`https://api.iconify.design/search?${params}`);
  if (!res.ok) throw new Error('Iconify API error');
  const data = await res.json() as { icons: string[] };
  const results = await Promise.all(
    data.icons.slice(0, 36).map(async (iconId) => {
      const [p, ...n] = iconId.split(':');
      const name = n.join(':');
      try {
        const svgRes = await fetch(`https://api.iconify.design/${p}/${name}.svg`);
        if (!svgRes.ok) return null;
        const svg = await svgRes.text();
        return { id: iconId, prefix: p, name, svg };
      } catch { return null; }
    })
  );
  return results.filter(Boolean) as IconResult[];
}

export function IconFinderTool() {
  const [query, setQuery] = React.useState('home');
  const [prefix, setPrefix] = React.useState('');
  const [icons, setIcons] = React.useState<IconResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<IconResult | null>(null);
  const [iconColor, setIconColor] = React.useState('#f5f5f7');
  const [iconSize, setIconSize] = React.useState(24);
  const [copied, setCopied] = React.useState('');
  const [searched, setSearched] = React.useState(false);

  const search = async () => {
    if (query.length < 2) return;
    setLoading(true); setSearched(true);
    try { setIcons(await searchIcons(query, prefix || undefined)); }
    catch { setIcons([]); }
    setLoading(false);
  };

  const copySvg = (icon: IconResult) => {
    const colored = icon.svg.replace(/currentColor/g, iconColor).replace(/width="[^"]+"/, `width="${iconSize}"`).replace(/height="[^"]+"/, `height="${iconSize}"`);
    navigator.clipboard.writeText(colored);
    setCopied('svg'); setTimeout(() => setCopied(''), 1500);
  };

  const download = (icon: IconResult) => {
    const colored = icon.svg.replace(/currentColor/g, iconColor).replace(/width="[^"]+"/, `width="${iconSize}"`).replace(/height="[^"]+"/, `height="${iconSize}"`);
    const a = document.createElement('a'); a.href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(colored)}`; a.download = `${icon.name}.svg`; a.click();
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-2 flex-wrap">
        <input className="flex-1 min-w-40 rounded-md border bg-card px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          value={query} onChange={e => setQuery(e.target.value)} placeholder="Search icons (e.g. home, user, arrow)"
          onKeyDown={e => e.key === 'Enter' && search()} />
        <select className="rounded-md border bg-card px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          value={prefix} onChange={e => setPrefix(e.target.value)}>
          <option value="">All sets</option>
          {ICONIFY_SETS.map(s => <option key={s.prefix} value={s.prefix}>{s.name}</option>)}
        </select>
        <button onClick={search} disabled={loading || query.length < 2}
          className="px-4 py-2 rounded-md text-sm font-medium bg-foreground text-background hover:opacity-90 disabled:opacity-50 transition-opacity">
          {loading ? '…' : 'Search'}
        </button>
      </div>

      {/* Icons grid */}
      {loading && <div className="text-center text-muted-foreground text-sm py-8">Searching 200,000+ icons…</div>}
      {!loading && icons.length > 0 && (
        <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
          {icons.map(icon => (
            <button key={icon.id} onClick={() => setSelected(icon)}
              className={`p-2 rounded-lg border flex items-center justify-center aspect-square transition-colors ${selected?.id === icon.id ? 'border-foreground/50 bg-foreground/10' : 'border-border bg-card hover:border-foreground/20'}`}
              title={icon.name}>
              <span dangerouslySetInnerHTML={{ __html: icon.svg.replace(/width="[^"]+"/, 'width="24"').replace(/height="[^"]+"/, 'height="24"').replace(/currentColor/g, '#e8e8ed') }} />
            </button>
          ))}
        </div>
      )}
      {!loading && searched && icons.length === 0 && <div className="text-center text-muted-foreground text-sm py-8">No icons found. Try a different query.</div>}
      {!searched && <div className="text-center text-muted-foreground text-sm py-8">Search to browse 200,000+ open-source icons from Iconify.</div>}

      {/* Selected panel */}
      {selected && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-lg border bg-background flex items-center justify-center shrink-0"
              dangerouslySetInnerHTML={{ __html: selected.svg.replace(/width="[^"]+"/, `width="${iconSize}"`).replace(/height="[^"]+"/, `height="${iconSize}"`).replace(/currentColor/g, iconColor) }} />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="font-mono text-sm font-medium">{selected.id}</div>
              <div className="flex flex-wrap gap-2">
                <div><label className="block text-xs text-muted-foreground mb-1">Colour</label>
                  <input type="color" value={iconColor} onChange={e => setIconColor(e.target.value)} className="h-7 w-20 rounded border border-border cursor-pointer" /></div>
                <div><label className="block text-xs text-muted-foreground mb-1">Size: {iconSize}px</label>
                  <input type="range" min={12} max={128} value={iconSize} onChange={e => setIconSize(+e.target.value)} className="w-28 accent-foreground" /></div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => copySvg(selected)} className="px-3 py-1.5 rounded-md text-xs border border-border hover:border-foreground/30 transition-colors">
              {copied === 'svg' ? 'Copied!' : 'Copy SVG'}
            </button>
            <button onClick={() => { navigator.clipboard.writeText(selected.id); setCopied('id'); setTimeout(() => setCopied(''), 1500); }}
              className="px-3 py-1.5 rounded-md text-xs border border-border hover:border-foreground/30 transition-colors">
              {copied === 'id' ? 'Copied!' : 'Copy ID'}
            </button>
            <button onClick={() => download(selected)} className="px-3 py-1.5 rounded-md text-xs border border-border hover:border-foreground/30 transition-colors">
              Download SVG
            </button>
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">Usage snippets</summary>
            <div className="mt-2 space-y-2">
              <pre className="rounded bg-muted/30 p-2 overflow-x-auto">{`// React\nimport { Icon } from '@iconify/react'\n<Icon icon="${selected.id}" />`}</pre>
              <pre className="rounded bg-muted/30 p-2 overflow-x-auto">{`<!-- HTML -->\n<script src="https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js"></script>\n<iconify-icon icon="${selected.id}"></iconify-icon>`}</pre>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
