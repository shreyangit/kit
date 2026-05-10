"use client";
import * as React from "react";

function generateSlug(text: string, sep: '-' | '_' | '.', lang: string): string {
  // Transliterate common chars and make URL safe
  let s = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  s = s.replace(/[^a-z0-9\s-_.]/g, '').trim();
  s = s.replace(/[\s_.-]+/g, sep);
  s = s.replace(new RegExp(`^[${sep}]+|[${sep}]+$`, 'g'), '');
  return s;
}

const SEPARATORS = [
  { id: '-' as const, label: 'Hyphen (-)', example: 'my-blog-post' },
  { id: '_' as const, label: 'Underscore (_)', example: 'my_blog_post' },
  { id: '.' as const, label: 'Dot (.)', example: 'my.blog.post' },
];

export function SlugGeneratorTool() {
  const [input, setInput] = React.useState('How to Build a Successful SaaS Product in 2025');
  const [sep, setSep] = React.useState<'-' | '_' | '.'>('-');
  const [maxLen, setMaxLen] = React.useState(0);
  const [bulk, setBulk] = React.useState(false);
  const [bulkInput, setBulkInput] = React.useState('');
  const [copied, setCopied] = React.useState('');

  const slug = React.useMemo(() => {
    let s = generateSlug(input, sep, 'en');
    if (maxLen > 0) s = s.slice(0, maxLen);
    return s;
  }, [input, sep, maxLen]);

  const warnings: string[] = [];
  if (slug.length > 75) warnings.push('Over 75 characters — consider a shorter title for SEO.');
  if (slug.length < 3 && slug.length > 0) warnings.push('Very short slug — may be too generic.');

  const baseSlug = generateSlug(input, '-', 'en');
  const words = baseSlug.split('-');
  const alternatives = {
    hyphen: baseSlug,
    underscore: generateSlug(input, '_', 'en'),
    dot: generateSlug(input, '.', 'en'),
    camelCase: words.map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(''),
    pascalCase: words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(''),
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  };

  const bulkSlugs = bulkInput.split('\n').filter(Boolean).map(line => ({
    original: line,
    slug: generateSlug(line, sep, 'en'),
  }));

  const downloadBulk = () => {
    const csv = 'Original,Slug\n' + bulkSlugs.map(r => `"${r.original}","${r.slug}"`).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'slugs.csv';
    a.click();
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs text-muted-foreground mb-1.5">Title or text</label>
        <input className="w-full rounded-md border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
          value={input} onChange={e => setInput(e.target.value)} placeholder="My awesome blog post title" />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <div className="text-xs text-muted-foreground mb-1.5">Separator</div>
          <div className="flex gap-1.5">
            {SEPARATORS.map(s => (
              <button key={s.id} onClick={() => setSep(s.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-mono border transition-colors ${sep === s.id ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:border-foreground/30'}`}>
                {s.id === '-' ? '−' : s.id}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1.5">Max length: {maxLen === 0 ? 'None' : maxLen}</div>
          <input type="range" min={0} max={100} step={5} value={maxLen} onChange={e => setMaxLen(+e.target.value)} className="accent-foreground" />
        </div>
      </div>

      {/* Result */}
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Generated slug ({slug.length} chars)</span>
          <button onClick={() => copy(slug, 'main')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {copied === 'main' ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="font-mono text-base font-medium break-all">{slug || <span className="text-muted-foreground">…</span>}</div>
        {warnings.map((w, i) => <div key={i} className="text-xs text-amber-500">{w}</div>)}
      </div>

      {/* Alternatives */}
      <div>
        <div className="text-xs text-muted-foreground mb-2">All formats</div>
        <div className="rounded-lg border bg-card/50 divide-y divide-border">
          {Object.entries(alternatives).map(([key, val]) => (
            <div key={key} className="flex items-center gap-3 px-3 py-2.5">
              <span className="text-xs text-muted-foreground w-24 shrink-0">{key}</span>
              <span className="font-mono text-sm flex-1 min-w-0 truncate">{val}</span>
              <button onClick={() => copy(val, key)} className="text-xs text-muted-foreground hover:text-foreground shrink-0 transition-colors">
                {copied === key ? '✓' : 'Copy'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Bulk mode */}
      <div>
        <button onClick={() => setBulk(b => !b)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          {bulk ? '− Hide bulk mode' : '+ Bulk mode (multiple titles)'}
        </button>
        {bulk && (
          <div className="mt-3 space-y-3">
            <textarea className="w-full h-32 rounded-md border bg-card px-3 py-2 font-mono text-xs outline-none focus:ring-1 focus:ring-ring resize-none"
              value={bulkInput} onChange={e => setBulkInput(e.target.value)} placeholder={"My First Post\nAnother Post Title\nYet Another"} />
            {bulkSlugs.length > 0 && (
              <>
                <div className="rounded-lg border bg-card/50 divide-y divide-border max-h-48 overflow-y-auto">
                  {bulkSlugs.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 text-xs">
                      <span className="text-muted-foreground truncate flex-1">{r.original}</span>
                      <span className="font-mono text-foreground truncate flex-1">{r.slug}</span>
                    </div>
                  ))}
                </div>
                <button onClick={downloadBulk} className="px-3 py-1.5 rounded-md text-sm border border-border hover:border-foreground/30 transition-colors">
                  Download CSV
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
