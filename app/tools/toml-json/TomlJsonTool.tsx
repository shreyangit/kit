"use client";
import * as React from "react";

async function convertToml(input: string, dir: 'toml-json' | 'json-toml') {
  if (dir === 'toml-json') {
    const TOML = await import('@iarna/toml');
    const parsed = TOML.parse(input);
    return JSON.stringify(parsed, null, 2);
  } else {
    const TOML = await import('@iarna/toml');
    const parsed = JSON.parse(input);
    return TOML.stringify(parsed as any);
  }
}

const EXAMPLE_TOML = `[package]
name = "my-app"
version = "1.0.0"
edition = "2021"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1", features = ["full"] }

[[servers]]
name = "production"
host = "example.com"
port = 443`;

export function TomlJsonTool() {
  const [dir, setDir] = React.useState<'toml-json' | 'json-toml'>('toml-json');
  const [input, setInput] = React.useState(EXAMPLE_TOML);
  const [output, setOutput] = React.useState('');
  const [error, setError] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!input.trim()) { setOutput(''); setError(''); return; }
    convertToml(input, dir).then(r => { setOutput(r); setError(''); }).catch(e => { setError((e as Error).message); setOutput(''); });
  }, [input, dir]);

  const copy = () => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(['toml-json', 'json-toml'] as const).map(d => (
          <button key={d} onClick={() => { setDir(d); setInput(''); setOutput(''); setError(''); }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${dir === d ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:border-foreground/30'}`}>
            {d === 'toml-json' ? 'TOML → JSON' : 'JSON → TOML'}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">{dir === 'toml-json' ? 'TOML input' : 'JSON input'}</label>
          <textarea className="w-full h-72 rounded-md border bg-card px-3 py-2 font-mono text-xs outline-none focus:ring-1 focus:ring-ring resize-none"
            value={input} onChange={e => setInput(e.target.value)} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-muted-foreground">{dir === 'toml-json' ? 'JSON output' : 'TOML output'}</label>
            {output && <button onClick={copy} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{copied ? 'Copied!' : 'Copy'}</button>}
          </div>
          {error ? (
            <div className="h-72 rounded-md border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-400 font-mono overflow-auto">{error}</div>
          ) : (
            <pre className="h-72 rounded-md border bg-card px-3 py-2 font-mono text-xs overflow-auto">{output}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
