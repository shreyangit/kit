"use client";
import * as React from "react";
import { Copy, Check, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Algo = "HS256" | "HS384" | "HS512" | "RS256";

const DEFAULT_PAYLOAD = JSON.stringify({ sub: "user_123", name: "John Doe", iat: Math.floor(Date.now() / 1000) }, null, 2);

function jwtParts(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const dec = (s: string) => JSON.parse(atob(s.replace(/-/g, "+").replace(/_/g, "/")));
    return { header: dec(parts[0]), payload: dec(parts[1]), sig: parts[2], raw: parts };
  } catch { return null; }
}

export function JwtGeneratorTool() {
  const [algo, setAlgo] = React.useState<Algo>("HS256");
  const [secret, setSecret] = React.useState("your-256-bit-secret");
  const [payload, setPayload] = React.useState(DEFAULT_PAYLOAD);
  const [payloadError, setPayloadError] = React.useState<string | null>(null);
  const [expiry, setExpiry] = React.useState("1h");
  const [issuer, setIssuer] = React.useState("");
  const [audience, setAudience] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [token, setToken] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [generating, setGenerating] = React.useState(false);
  const [copied, setCopied] = React.useState<"token" | null>(null);
  const [tab, setTab] = React.useState<"generate" | "verify">("generate");
  const [verifyToken, setVerifyToken] = React.useState("");
  const [verifySecret, setVerifySecret] = React.useState("");
  const [verifyResult, setVerifyResult] = React.useState<{ ok: boolean; header?: Record<string,unknown>; payload?: Record<string,unknown>; error?: string } | null>(null);

  function validatePayload(s: string): Record<string, unknown> | null {
    try { const p = JSON.parse(s); setPayloadError(null); return p; }
    catch (e) { setPayloadError(`Invalid JSON: ${(e as Error).message}`); return null; }
  }

  async function generate() {
    const p = validatePayload(payload);
    if (!p) return;
    setGenerating(true); setError(null);
    try {
      const { SignJWT } = await import("jose");
      const enc = new TextEncoder();
      const key = enc.encode(secret);
      let builder = new SignJWT(p).setProtectedHeader({ alg: algo }).setIssuedAt();
      if (expiry) {
        const map: Record<string, number> = { m: 60, h: 3600, d: 86400, w: 604800 };
        const match = expiry.match(/^(\d+)([mhdw])$/);
        if (match) builder = builder.setExpirationTime(Math.floor(Date.now() / 1000) + parseInt(match[1]) * (map[match[2]] ?? 1));
      }
      if (issuer) builder = builder.setIssuer(issuer);
      if (audience) builder = builder.setAudience(audience);
      if (subject) builder = builder.setSubject(subject);
      const jwt = await builder.sign(key);
      setToken(jwt);
    } catch (e) { setError((e as Error).message); }
    finally { setGenerating(false); }
  }

  async function verify() {
    if (!verifyToken.trim()) return;
    try {
      const { jwtVerify } = await import("jose");
      const key = new TextEncoder().encode(verifySecret);
      const { payload: p, protectedHeader: h } = await jwtVerify(verifyToken.trim(), key);
      setVerifyResult({ ok: true, header: h, payload: p });
    } catch (e) {
      const parts = jwtParts(verifyToken.trim());
      if (parts) setVerifyResult({ ok: false, error: (e as Error).message, header: parts.header, payload: parts.payload });
      else setVerifyResult({ ok: false, error: (e as Error).message });
    }
  }

  async function copy(text: string, key: "token") {
    await navigator.clipboard.writeText(text);
    setCopied(key); setTimeout(() => setCopied(null), 1500);
  }

  const parts = token ? jwtParts(token) : null;

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Tabs */}
      <div className="flex gap-1.5">
        {(["generate","verify"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${tab === t ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "generate" && (
        <>
          {/* Algorithm */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Algorithm</span>
            {(["HS256","HS384","HS512","RS256"] as Algo[]).map(a => (
              <button key={a} onClick={() => setAlgo(a)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-colors ${algo === a ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {a}
              </button>
            ))}
          </div>

          {/* Secret */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Secret (HMAC)</label>
            <div className="flex gap-2">
              <input id="jwt-secret" type="password" value={secret} onChange={e => setSecret(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring" />
              <Button variant="outline" size="sm" onClick={() => {
                const a = new Uint8Array(32); crypto.getRandomValues(a);
                setSecret(btoa(String.fromCharCode(...a)).replace(/[+/=]/g, c => ({ "+": "-", "/": "_", "=": "" }[c] ?? c)));
              }} className="gap-1 shrink-0"><RefreshCw className="h-3.5 w-3.5" />Random</Button>
            </div>
          </div>

          {/* Payload */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Payload (JSON)</label>
            <textarea id="jwt-payload" value={payload}
              onChange={e => { setPayload(e.target.value); validatePayload(e.target.value); }}
              className="w-full h-32 rounded-md border border-input bg-background px-3 py-2.5 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              spellCheck={false} />
            {payloadError && <p className="text-xs text-destructive">{payloadError}</p>}
          </div>

          {/* Standard claims */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Expires in</label>
              <select value={expiry} onChange={e => setExpiry(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">None</option>
                <option value="15m">15 minutes</option>
                <option value="1h">1 hour</option>
                <option value="24h">24 hours</option>
                <option value="7d">7 days</option>
                <option value="30d">30 days</option>
              </select>
            </div>
            {[["iss", "Issuer", issuer, setIssuer], ["aud", "Audience", audience, setAudience], ["sub", "Subject", subject, setSubject]].map(([id, label, val, set]) => (
              <div key={id as string} className="space-y-1">
                <label className="text-xs text-muted-foreground">{label as string}</label>
                <input value={val as string} onChange={e => (set as (v: string) => void)(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Optional" />
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={generate} disabled={generating || !!payloadError} id="jwt-sign">
              {generating ? "Signing…" : "Sign JWT"}
            </Button>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          {/* Token output */}
          {token && (
            <div className="space-y-3">
              <div className="rounded-lg border border-border/60 bg-secondary/10 px-4 py-3 font-mono text-xs break-all leading-relaxed">
                {parts ? (
                  <>
                    <span className="text-rose-400">{parts.raw[0]}</span>
                    <span className="text-muted-foreground">.</span>
                    <span className="text-violet-400">{parts.raw[1]}</span>
                    <span className="text-muted-foreground">.</span>
                    <span className="text-cyan-400">{parts.raw[2]}</span>
                  </>
                ) : token}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => copy(token, "token")} className="gap-1.5">
                  {copied === "token" ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === "token" ? "Copied!" : "Copy JWT"}
                </Button>
                <a href={`https://jwt.io/#debugger-io?token=${encodeURIComponent(token)}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors self-center ml-1">
                  Test on jwt.io →
                </a>
              </div>
              {parts && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {[["Header", parts.header], ["Payload", parts.payload]].map(([label, obj]) => (
                    <div key={label as string} className="rounded-md border border-border/60 bg-card px-3 py-2.5">
                      <p className="text-muted-foreground mb-1.5 font-medium">{label as string}</p>
                      <pre className="text-[11px] leading-relaxed overflow-x-auto">{JSON.stringify(obj, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {tab === "verify" && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">JWT Token</label>
            <textarea id="jwt-verify-token" value={verifyToken} onChange={e => setVerifyToken(e.target.value)}
              placeholder="eyJhbGci…"
              className="w-full h-24 rounded-md border border-input bg-background px-3 py-2.5 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              spellCheck={false} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Secret (to verify signature)</label>
            <input type="password" value={verifySecret} onChange={e => setVerifySecret(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <Button onClick={verify} id="jwt-verify-btn">Verify & Decode</Button>

          {verifyResult && (
            <div className={`rounded-lg border px-4 py-3 ${verifyResult.ok ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}>
              <p className={`text-sm font-semibold mb-2 ${verifyResult.ok ? "text-green-500" : "text-destructive"}`}>
                {verifyResult.ok ? "✓ Valid — signature verified" : String(verifyResult.error ?? "Invalid token")}
              </p>
              {(verifyResult.header || verifyResult.payload) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(["Header", "Payload"] as const).map((label) => {
                    const obj = label === "Header" ? verifyResult.header : verifyResult.payload;
                    return obj ? (
                      <div key={label}>
                        <p className="text-xs text-muted-foreground mb-1">{label}</p>
                        <pre className="text-[11px] font-mono leading-relaxed overflow-x-auto">{JSON.stringify(obj, null, 2)}</pre>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
