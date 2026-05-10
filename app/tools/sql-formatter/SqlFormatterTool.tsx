"use client";
import * as React from "react";

async function formatSQL(sql: string, dialect: string) {
  const { format } = await import('sql-formatter');
  return format(sql, { language: dialect as any, tabWidth: 2, keywordCase: 'upper' });
}

const DIALECTS = [
  { id: 'sql', label: 'Standard SQL' }, { id: 'mysql', label: 'MySQL' },
  { id: 'postgresql', label: 'PostgreSQL' }, { id: 'sqlite', label: 'SQLite' },
  { id: 'bigquery', label: 'BigQuery' }, { id: 'tsql', label: 'T-SQL (MSSQL)' },
];

const EXAMPLES = [
  { label: 'SELECT + JOIN', sql: `select u.id,u.name,u.email,o.total,o.created_at from users u inner join orders o on u.id=o.user_id where u.active=1 and o.total>100 order by o.created_at desc limit 10` },
  { label: 'CREATE TABLE', sql: `create table products(id int primary key auto_increment,name varchar(255) not null,price decimal(10,2) not null,category_id int,created_at timestamp default current_timestamp,foreign key(category_id) references categories(id))` },
  { label: 'UPDATE', sql: `update users set last_login=now(),login_count=login_count+1 where id=42 and active=true` },
];

export function SqlFormatterTool() {
  const [input, setInput] = React.useState(EXAMPLES[0].sql);
  const [dialect, setDialect] = React.useState('postgresql');
  const [output, setOutput] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const format = React.useCallback(async () => {
    if (!input.trim()) { setOutput(''); return; }
    setLoading(true);
    try {
      const result = await formatSQL(input, dialect);
      setOutput(result); setError('');
    } catch (e) { setError((e as Error).message); }
    setLoading(false);
  }, [input, dialect]);

  React.useEffect(() => { format(); }, [format]);

  const copy = () => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <select className="rounded-md border bg-card px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          value={dialect} onChange={e => setDialect(e.target.value)}>
          {DIALECTS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
        </select>
        <div className="flex gap-1.5 flex-wrap">
          {EXAMPLES.map(ex => (
            <button key={ex.label} onClick={() => setInput(ex.sql)}
              className="px-2.5 py-1 rounded-md text-xs border border-border text-muted-foreground hover:border-foreground/30 transition-colors">
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">SQL input</label>
          <textarea className="w-full h-72 rounded-md border bg-card px-3 py-2 font-mono text-xs outline-none focus:ring-1 focus:ring-ring resize-none"
            value={input} onChange={e => setInput(e.target.value)} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-muted-foreground">Formatted SQL</label>
            {output && <button onClick={copy} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{copied ? 'Copied!' : 'Copy'}</button>}
          </div>
          {error ? (
            <div className="h-72 rounded-md border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-400 font-mono overflow-auto">{error}</div>
          ) : loading ? (
            <div className="h-72 rounded-md border bg-card flex items-center justify-center text-xs text-muted-foreground">Formatting…</div>
          ) : (
            <pre className="h-72 rounded-md border bg-card px-3 py-2 font-mono text-xs overflow-auto">{output}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
