"use client";
import * as React from "react";

function parseEnv(raw: string) {
  const lines = raw.split('\n');
  const entries: { key: string; value: string; comment: string; lineNo: number; type: string }[] = [];
  const errors: string[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      if (trimmed.startsWith('#')) {
        // standalone comment — skip
      }
      return;
    }
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) { errors.push(`Line ${i + 1}: Missing = sign`); return; }
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    const comment = '';
    if (!key.match(/^[A-Z_][A-Z0-9_]*$/i)) errors.push(`Line ${i + 1}: Key "${key}" contains invalid characters`);
    // Strip quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    const type = /^(true|false)$/i.test(value) ? 'boolean' : /^\d+$/.test(value) ? 'number' : value.startsWith('http') ? 'url' : 'string';
    entries.push({ key, value, comment, lineNo: i + 1, type });
  });

  return { entries, errors };
}

const TYPE_COLORS: Record<string, string> = { string: '#60a5fa', number: '#4ade80', boolean: '#fbbf24', url: '#a78bfa' };

export function EnvParserTool() {
  const [input, setInput] = React.useState(`# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
DB_PORT=5432

# App
NODE_ENV=production
PORT=3000
DEBUG=false
APP_URL=https://example.com

# Auth
JWT_SECRET=super-secret-key-here
JWT_EXPIRES_IN=7d`);
  const [format, setFormat] = React.useState<'table' | 'json' | 'export'>('table');
  const [copied, setCopied] = React.useState('');

  const { entries, errors } = React.useMemo(() => parseEnv(input), [input]);

  const jsonOutput = JSON.stringify(Object.fromEntries(entries.map(e => [e.key, e.value])), null, 2);
  const exportOutput = entries.map(e => `${e.key}=${e.value}`).join('\n');

  const copy = (text: string, key: string) => { navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1500); };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs text-muted-foreground mb-1.5">.env file contents</label>
        <textarea className="w-full h-44 rounded-md border bg-card px-3 py-2 font-mono text-xs outline-none focus:ring-1 focus:ring-ring resize-y"
          value={input} onChange={e => setInput(e.target.value)} placeholder="DATABASE_URL=postgres://..." />
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 space-y-1">
          {errors.map((e, i) => <div key={i} className="text-xs text-red-400">{e}</div>)}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {(['table', 'json', 'export'] as const).map(f => (
          <button key={f} onClick={() => setFormat(f)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${format === f ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:border-foreground/30'}`}>
            {f === 'table' ? 'Table view' : f === 'json' ? 'JSON' : 'Export .env'}
          </button>
        ))}
      </div>

      {format === 'table' && (
        <div className="rounded-lg border bg-card/50 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left p-3 text-xs text-muted-foreground">Key</th><th className="text-left p-3 text-xs text-muted-foreground">Value</th><th className="p-3 text-xs text-muted-foreground">Type</th></tr></thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="p-3 font-mono text-xs font-medium">{e.key}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground max-w-xs truncate">{e.value || <em className="opacity-50">empty</em>}</td>
                  <td className="p-3 text-center"><span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: `${TYPE_COLORS[e.type]}22`, color: TYPE_COLORS[e.type] }}>{e.type}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 && <div className="text-center text-muted-foreground text-sm py-6">No variables parsed yet.</div>}
        </div>
      )}

      {format === 'json' && (
        <div className="space-y-2">
          <div className="flex justify-end">
            <button onClick={() => copy(jsonOutput, 'json')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {copied === 'json' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="rounded-lg border bg-card p-4 text-xs font-mono overflow-x-auto max-h-64">{jsonOutput}</pre>
        </div>
      )}

      {format === 'export' && (
        <div className="space-y-2">
          <div className="flex justify-end gap-3">
            <button onClick={() => copy(exportOutput, 'export')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {copied === 'export' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="rounded-lg border bg-card p-4 text-xs font-mono overflow-x-auto max-h-64">{exportOutput}</pre>
        </div>
      )}

      <div className="text-xs text-muted-foreground">{entries.length} variables parsed · {errors.length} issues</div>
    </div>
  );
}
