"use client";
import * as React from "react";

async function validateSchema(data: string, schema: string) {
  const Ajv = (await import('ajv')).default;
  const addFormats = (await import('ajv-formats')).default;
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  try {
    const parsedData = JSON.parse(data);
    const parsedSchema = JSON.parse(schema);
    const validate = ajv.compile(parsedSchema);
    const valid = validate(parsedData);
    if (valid) return { valid: true, errors: [] };
    return { valid: false, errors: (validate.errors ?? []).map(e => ({ path: e.instancePath || '/', message: e.message ?? '', schema: e.schemaPath })) };
  } catch (e) {
    return { valid: false, errors: [{ path: '/', message: (e as Error).message, schema: '' }] };
  }
}

function inferSchema(jsonStr: string): string {
  function build(v: unknown): object {
    if (v === null) return { type: 'null' };
    if (typeof v === 'string') return { type: 'string' };
    if (typeof v === 'number') return Number.isInteger(v) ? { type: 'integer' } : { type: 'number' };
    if (typeof v === 'boolean') return { type: 'boolean' };
    if (Array.isArray(v)) return { type: 'array', items: v.length ? build(v[0]) : {} };
    if (typeof v === 'object') {
      const props: Record<string, object> = {};
      const req: string[] = [];
      for (const [k, val] of Object.entries(v as object)) { props[k] = build(val); if (val != null) req.push(k); }
      return { type: 'object', properties: props, required: req };
    }
    return {};
  }
  try { return JSON.stringify(build(JSON.parse(jsonStr)), null, 2); } catch { return '{}'; }
}

const EXAMPLE_SCHEMA = `{
  "type": "object",
  "properties": {
    "name": { "type": "string", "minLength": 1 },
    "age": { "type": "integer", "minimum": 0 },
    "email": { "type": "string", "format": "email" }
  },
  "required": ["name", "age"]
}`;

const EXAMPLE_DATA = `{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com"
}`;

export function JsonSchemaValidatorTool() {
  const [data, setData] = React.useState(EXAMPLE_DATA);
  const [schema, setSchema] = React.useState(EXAMPLE_SCHEMA);
  const [result, setResult] = React.useState<{ valid: boolean; errors: { path: string; message: string; schema: string }[] } | null>(null);
  const [loading, setLoading] = React.useState(false);

  const validate = async () => {
    setLoading(true);
    const r = await validateSchema(data, schema);
    setResult(r);
    setLoading(false);
  };

  const infer = () => { setSchema(inferSchema(data)); };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-muted-foreground">JSON data</label>
          </div>
          <textarea className="w-full h-64 rounded-md border bg-card px-3 py-2 font-mono text-xs outline-none focus:ring-1 focus:ring-ring resize-none"
            value={data} onChange={e => setData(e.target.value)} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-muted-foreground">JSON Schema</label>
            <button onClick={infer} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Infer from data</button>
          </div>
          <textarea className="w-full h-64 rounded-md border bg-card px-3 py-2 font-mono text-xs outline-none focus:ring-1 focus:ring-ring resize-none"
            value={schema} onChange={e => setSchema(e.target.value)} />
        </div>
      </div>

      <button onClick={validate} disabled={loading}
        className="px-4 py-2 rounded-md text-sm font-medium bg-foreground text-background hover:opacity-90 disabled:opacity-50 transition-opacity">
        {loading ? 'Validating…' : 'Validate'}
      </button>

      {result && (
        <div className={`rounded-lg border p-4 ${result.valid ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
          <div className={`font-medium text-sm mb-2 ${result.valid ? 'text-green-400' : 'text-red-400'}`}>
            {result.valid ? '✓ Valid — data matches the schema' : `✗ ${result.errors.length} validation error${result.errors.length > 1 ? 's' : ''}`}
          </div>
          {result.errors.map((e, i) => (
            <div key={i} className="mt-2 pt-2 border-t border-border first:mt-0 first:pt-0 first:border-0">
              <div className="font-mono text-xs text-red-400">{e.path}</div>
              <div className="text-sm">{e.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
