"use client";
import * as React from "react";

// js-yaml loaded dynamically to avoid SSR issues
async function loadYaml() {
  const mod = await import('js-yaml');
  return mod.default ?? mod;
}

export function YamlJsonTool() {
  const [dir, setDir] = React.useState<'yaml-to-json' | 'json-to-yaml'>('yaml-to-json');
  const [input, setInput] = React.useState(`name: John Doe
age: 30
active: true
roles:
  - admin
  - user
address:
  city: New York
  country: US`);
  const [output, setOutput] = React.useState('');
  const [error, setError] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  const convert = React.useCallback(async () => {
    if (!input.trim()) { setOutput(''); setError(''); return; }
    try {
      const yaml = await loadYaml();
      if (dir === 'yaml-to-json') {
        const parsed = yaml.load(input);
        setOutput(JSON.stringify(parsed, null, 2));
      } else {
        const parsed = JSON.parse(input);
        setOutput(yaml.dump(parsed, { indent: 2 }));
      }
      setError('');
    } catch (e) {
      setError((e as Error).message);
      setOutput('');
    }
  }, [input, dir]);

  React.useEffect(() => { convert(); }, [convert]);

  const copy = () => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const swap = () => {
    setDir(d => d === 'yaml-to-json' ? 'json-to-yaml' : 'yaml-to-json');
    setInput(output || input);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5">
          {(['yaml-to-json', 'json-to-yaml'] as const).map(d => (
            <button key={d} onClick={() => { setDir(d); setInput(''); setOutput(''); setError(''); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${dir === d ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:border-foreground/30'}`}>
              {d === 'yaml-to-json' ? 'YAML → JSON' : 'JSON → YAML'}
            </button>
          ))}
        </div>
        <button onClick={swap} className="px-3 py-1.5 rounded-md text-sm border border-border text-muted-foreground hover:border-foreground/30 transition-colors">⇄ Swap</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">{dir === 'yaml-to-json' ? 'YAML input' : 'JSON input'}</label>
          <textarea className="w-full h-72 rounded-md border bg-card px-3 py-2 font-mono text-xs outline-none focus:ring-1 focus:ring-ring resize-none"
            value={input} onChange={e => setInput(e.target.value)} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-muted-foreground">{dir === 'yaml-to-json' ? 'JSON output' : 'YAML output'}</label>
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
