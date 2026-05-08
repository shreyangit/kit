"use client";
import * as React from "react";
import { Copy, Check, Download, Plus, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadText } from "@/lib/utils/download";

// ── Data banks ──────────────────────────────────────────────────────────────
const FIRST_NAMES = ["Alice","Bob","Carol","David","Emma","Frank","Grace","Henry","Isabella","James","Kate","Liam","Mia","Noah","Olivia","Peter","Quinn","Rachel","Sam","Tara","Arjun","Priya","Raj","Ananya","Wei","Mei","Carlos","Maria","Ahmed","Fatima","Lars","Ingrid"];
const LAST_NAMES = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Lee","Perez","Thompson","White","Harris","Sharma","Patel","Kumar","Singh","Tanaka","Sato","Nakamura"];
const DOMAINS = ["gmail.com","yahoo.com","hotmail.com","outlook.com","company.com","example.org","test.io","mail.net","web.co","inbox.dev"];
const STREETS = ["Main St","Oak Ave","Maple Dr","Cedar Ln","Elm St","Park Blvd","Lake Rd","Hill St","River Rd","Forest Ave","Sunrise Blvd","Garden Way","Valley Dr","Mountain Rd"];
const CITIES = ["New York","Los Angeles","Chicago","Houston","Phoenix","Philadelphia","Dallas","San Jose","Mumbai","Delhi","Bangalore","London","Paris","Berlin","Tokyo","Sydney","Toronto","Dubai"];
const COUNTRIES = ["United States","India","United Kingdom","Canada","Australia","Germany","France","Japan","Brazil","Mexico"];
const COMPANIES = ["Acme Corp","Globex","Initech","Umbrella Corp","Cyberdyne","Tyrell Corp","Massive Dynamic","Stark Industries","Wayne Enterprises","Pied Piper","Hooli","Dunder Mifflin"];
const JOB_TITLES = ["Software Engineer","Product Manager","Designer","Data Analyst","DevOps Engineer","Marketing Manager","Sales Representative","HR Manager","Financial Analyst","Customer Success Manager","QA Engineer","CTO","CEO","Frontend Developer","Cloud Architect"];

function rnd(max: number) { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % max; }
function pick<T>(arr: T[]): T { return arr[rnd(arr.length)]; }
function randInt(min: number, max: number) { return min + rnd(max - min + 1); }

type FieldType = "firstName"|"lastName"|"fullName"|"email"|"phone"|"age"|"address"|"city"|"country"|"zipCode"|"company"|"jobTitle"|"uuid"|"boolean"|"integer"|"float"|"date"|"url"|"ipv4"|"username"|"password"|"sentence";
type OutputFormat = "json" | "csv" | "sql" | "typescript";

interface Field { id: string; name: string; type: FieldType; }

const FIELD_OPTIONS: { value: FieldType; label: string }[] = [
  { value: "firstName", label: "First Name" }, { value: "lastName", label: "Last Name" },
  { value: "fullName", label: "Full Name" }, { value: "email", label: "Email" },
  { value: "phone", label: "Phone" }, { value: "age", label: "Age" },
  { value: "address", label: "Address" }, { value: "city", label: "City" },
  { value: "country", label: "Country" }, { value: "zipCode", label: "Zip Code" },
  { value: "company", label: "Company" }, { value: "jobTitle", label: "Job Title" },
  { value: "uuid", label: "UUID" }, { value: "boolean", label: "Boolean" },
  { value: "integer", label: "Integer" }, { value: "float", label: "Float" },
  { value: "date", label: "Date" }, { value: "url", label: "URL" },
  { value: "ipv4", label: "IPv4" }, { value: "username", label: "Username" },
  { value: "password", label: "Password" }, { value: "sentence", label: "Sentence" },
];

function genValue(type: FieldType): unknown {
  switch (type) {
    case "firstName": return pick(FIRST_NAMES);
    case "lastName": return pick(LAST_NAMES);
    case "fullName": return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    case "email": return `${pick(FIRST_NAMES).toLowerCase()}.${pick(LAST_NAMES).toLowerCase()}${randInt(1,99)}@${pick(DOMAINS)}`;
    case "phone": return `+1-${randInt(200,999)}-${randInt(100,999)}-${randInt(1000,9999)}`;
    case "age": return randInt(18, 80);
    case "address": return `${randInt(1,9999)} ${pick(STREETS)}, Apt ${randInt(1,100)}`;
    case "city": return pick(CITIES);
    case "country": return pick(COUNTRIES);
    case "zipCode": return String(randInt(10000,99999)).padStart(5,"0");
    case "company": return pick(COMPANIES);
    case "jobTitle": return pick(JOB_TITLES);
    case "uuid": { const h = () => randInt(0,15).toString(16); return `${h()}${h()}${h()}${h()}-${h()}${h()}-4${h()}${h()}-${(8+rnd(4)).toString(16)}${h()}${h()}-${h()}${h()}${h()}${h()}${h()}${h()}`; }
    case "boolean": return rnd(2) === 0;
    case "integer": return randInt(0,1000);
    case "float": return parseFloat((Math.random() * 1000).toFixed(2));
    case "date": { const from = new Date("2000-01-01").getTime(), to = Date.now(); return new Date(from + rnd(to-from)).toISOString().split("T")[0]; }
    case "url": return `https://www.${pick(["example","test","demo","sample"])}.${pick(["com","io","org","net"])}`;
    case "ipv4": return `${randInt(1,254)}.${randInt(0,255)}.${randInt(0,255)}.${randInt(1,254)}`;
    case "username": return `${pick(FIRST_NAMES).toLowerCase()}${randInt(10,9999)}`;
    case "password": { const ch="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"; return Array.from({length:randInt(12,20)},()=>ch[rnd(ch.length)]).join(""); }
    case "sentence": { const ws=["lorem","ipsum","dolor","sit","amet","consectetur","adipiscing","elit","sed","do","eiusmod","tempor","incididunt","labore","dolore","magna"]; const len=randInt(6,14); const arr=Array.from({length:len},()=>ws[rnd(ws.length)]); arr[0]=arr[0].charAt(0).toUpperCase()+arr[0].slice(1); return arr.join(" ")+"."; }
    default: return "";
  }
}

function generateData(fields: Field[], rows: number, format: OutputFormat, table: string): string {
  const data = Array.from({ length: rows }, () => {
    const row: Record<string, unknown> = {};
    fields.forEach(f => { row[f.name] = genValue(f.type); });
    return row;
  });
  if (format === "json") return JSON.stringify(data, null, 2);
  if (format === "csv") {
    const hdr = fields.map(f => f.name).join(",");
    const rows_ = data.map(r => fields.map(f => { const v = String(r[f.name]); return v.includes(",") || v.includes('"') ? `"${v.replace(/"/g,'""')}"` : v; }).join(","));
    return [hdr, ...rows_].join("\n");
  }
  if (format === "sql") {
    const cols = fields.map(f => f.name).join(", ");
    const vals = data.map(r => {
      const v = fields.map(f => { const val = r[f.name]; if (typeof val === "boolean") return val ? "TRUE" : "FALSE"; if (typeof val === "number") return val; return `'${String(val).replace(/'/g,"''")}'`; }).join(", ");
      return `(${v})`;
    });
    return `INSERT INTO ${table} (${cols}) VALUES\n${vals.join(",\n")};`;
  }
  // typescript
  const typeMap: Record<FieldType, string> = { firstName:"string",lastName:"string",fullName:"string",email:"string",phone:"string",age:"number",address:"string",city:"string",country:"string",zipCode:"string",company:"string",jobTitle:"string",uuid:"string",boolean:"boolean",integer:"number",float:"number",date:"string",url:"string",ipv4:"string",username:"string",password:"string",sentence:"string" };
  const iface = `interface ${table.charAt(0).toUpperCase()+table.slice(1)} {\n` + fields.map(f => `  ${f.name}: ${typeMap[f.type]};`).join("\n") + "\n}\n\n";
  return iface + `const data: ${table.charAt(0).toUpperCase()+table.slice(1)}[] = ${JSON.stringify(data, null, 2)};`;
}

export function FakeDataGeneratorTool() {
  const [fields, setFields] = React.useState<Field[]>([
    { id: "1", name: "firstName", type: "firstName" },
    { id: "2", name: "lastName", type: "lastName" },
    { id: "3", name: "email", type: "email" },
    { id: "4", name: "age", type: "age" },
  ]);
  const [rows, setRows] = React.useState(10);
  const [format, setFormat] = React.useState<OutputFormat>("json");
  const [table, setTable] = React.useState("users");
  const [output, setOutput] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  function addField() {
    setFields(f => [...f, { id: Math.random().toString(36).slice(2), name: "field", type: "firstName" }]);
  }
  function removeField(id: string) { setFields(f => f.filter(x => x.id !== id)); }
  function updateField(id: string, key: keyof Field, val: string) {
    setFields(f => f.map(x => x.id === id ? { ...x, [key]: val } : x));
  }

  function generate() {
    if (!fields.length) return;
    setOutput(generateData(fields, Math.min(rows, 10000), format, table));
  }

  async function copy() { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500); }

  const preview = React.useMemo(() => {
    if (!fields.length) return [];
    return Array.from({ length: Math.min(3, rows) }, () => {
      const row: Record<string, unknown> = {};
      fields.forEach(f => { row[f.name] = genValue(f.type); });
      return row;
    });
  }, [fields, rows]);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Fields */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-medium">Fields</p>
          <Button variant="outline" size="sm" onClick={addField} className="h-7 text-xs gap-1">
            <Plus className="h-3.5 w-3.5" />Add field
          </Button>
        </div>
        {fields.map(f => (
          <div key={f.id} className="flex items-center gap-2">
            <input value={f.name} onChange={e => updateField(f.id, "name", e.target.value)}
              className="w-32 sm:w-40 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring" />
            <select value={f.type} onChange={e => updateField(f.id, "type", e.target.value)}
              className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring">
              {FIELD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={() => removeField(f.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Options row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Rows</label>
          <input type="number" value={rows} min={1} max={10000}
            onChange={e => setRows(Math.max(1, Math.min(10000, parseInt(e.target.value) || 1)))}
            className="w-20 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-ring" />
          {rows > 1000 && <span className="text-xs text-amber-500">Large output</span>}
        </div>
        {(format === "sql" || format === "typescript") && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Table / type name</label>
            <input value={table} onChange={e => setTable(e.target.value)}
              className="w-28 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
        )}
      </div>

      {/* Format tabs */}
      <div className="flex gap-1.5">
        {(["json","csv","sql","typescript"] as OutputFormat[]).map(f => (
          <button key={f} onClick={() => setFormat(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${format === f ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Preview table */}
      {fields.length > 0 && preview.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-xs">
            <thead><tr className="bg-secondary/30 border-b border-border/60">
              {fields.map(f => <th key={f.id} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">{f.name}</th>)}
            </tr></thead>
            <tbody>{preview.map((row, i) => (
              <tr key={i} className="border-b border-border/40 last:border-0">
                {fields.map(f => <td key={f.id} className="px-3 py-2 text-muted-foreground truncate max-w-32">{String(row[f.name])}</td>)}
              </tr>
            ))}</tbody>
          </table>
          {rows > 3 && <p className="px-3 py-1.5 text-[10px] text-muted-foreground border-t border-border/40">Showing 3 of {rows} rows</p>}
        </div>
      )}

      {/* Generate */}
      <div className="flex gap-2">
        <Button onClick={generate} id="fake-generate" className="gap-1.5">
          Generate {rows} rows
        </Button>
        {output && (
          <Button variant="outline" onClick={() => { setOutput(generateData(fields, Math.min(rows, 10000), format, table)); }} className="gap-1.5">
            <RefreshCw className="h-4 w-4" />Regenerate
          </Button>
        )}
      </div>

      {/* Output */}
      {output && (
        <div className="space-y-2">
          <textarea readOnly value={output}
            className="w-full h-64 rounded-md border border-input bg-background px-3 py-2.5 font-mono text-xs leading-relaxed resize-y focus:outline-none" spellCheck={false} />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copy} className="gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied!" : "Copy"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadText(output, `fake-data.${format === "typescript" ? "ts" : format}`)} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />Download
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
