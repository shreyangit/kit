"use client";

import * as React from "react";
import QRCode from "qrcode";
import { Download, Copy, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { downloadText } from "@/lib/utils/download";
import { downloadBlob } from "@/lib/utils/download";
import { cn } from "@/lib/utils";

type ECL = "L" | "M" | "Q" | "H";

const ECL_LABELS: Record<ECL, string> = {
  L: "Low (7%)",
  M: "Medium (15%)",
  Q: "Quartile (25%)",
  H: "High (30%)",
};

// ── Content builders ────────────────────────────────────────────────────────

interface URLData { url: string }
interface TextData { text: string }
interface EmailData { to: string; subject: string; body: string }
interface PhoneData { phone: string }
interface SMSData { phone: string; message: string }
interface WifiData { ssid: string; password: string; security: "WPA" | "WEP" | "nopass"; hidden: boolean }
interface VCardData { name: string; phone: string; email: string; org: string; url: string; note: string }

function buildURL(d: URLData) { return d.url.trim(); }
function buildText(d: TextData) { return d.text; }
function buildEmail(d: EmailData) {
  let s = `mailto:${d.to}`;
  const params = [];
  if (d.subject) params.push(`subject=${encodeURIComponent(d.subject)}`);
  if (d.body) params.push(`body=${encodeURIComponent(d.body)}`);
  if (params.length) s += "?" + params.join("&");
  return s;
}
function buildPhone(d: PhoneData) { return `tel:${d.phone.replace(/\s/g, "")}`; }
function buildSMS(d: SMSData) { return `sms:${d.phone}${d.message ? `?body=${encodeURIComponent(d.message)}` : ""}`; }
function buildWifi(d: WifiData) {
  const ssid = d.ssid.replace(/[\\;,"]/g, (c) => `\\${c}`);
  const pwd = d.password.replace(/[\\;,"]/g, (c) => `\\${c}`);
  return `WIFI:S:${ssid};T:${d.security};P:${pwd};H:${d.hidden ? "true" : "false"};;`;
}
function buildVCard(d: VCardData) {
  return [
    "BEGIN:VCARD", "VERSION:3.0",
    d.name && `FN:${d.name}`,
    d.phone && `TEL:${d.phone}`,
    d.email && `EMAIL:${d.email}`,
    d.org && `ORG:${d.org}`,
    d.url && `URL:${d.url}`,
    d.note && `NOTE:${d.note}`,
    "END:VCARD",
  ].filter(Boolean).join("\n");
}

// ── Type forms ───────────────────────────────────────────────────────────────

function Field({ label, id, type = "text", value, onChange, placeholder, className }: {
  label: string; id: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium" htmlFor={id}>{label}</label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="text-sm" />
    </div>
  );
}

type TabType = "url" | "text" | "email" | "phone" | "sms" | "wifi" | "vcard";

export function QrCodeTool() {
  const [activeType, setActiveType] = React.useState<TabType>("url");

  // Per-type state
  const [urlData, setUrlData] = React.useState<URLData>({ url: "" });
  const [textData, setTextData] = React.useState<TextData>({ text: "" });
  const [emailData, setEmailData] = React.useState<EmailData>({ to: "", subject: "", body: "" });
  const [phoneData, setPhoneData] = React.useState<PhoneData>({ phone: "" });
  const [smsData, setSmsData] = React.useState<SMSData>({ phone: "", message: "" });
  const [wifiData, setWifiData] = React.useState<WifiData>({ ssid: "", password: "", security: "WPA", hidden: false });
  const [vcardData, setVcardData] = React.useState<VCardData>({ name: "", phone: "", email: "", org: "", url: "", note: "" });

  // QR settings
  const [size, setSize] = React.useState(256);
  const [ecl, setEcl] = React.useState<ECL>("M");
  const [fgColor, setFgColor] = React.useState("#000000");
  const [bgColor, setBgColor] = React.useState("#ffffff");

  // Output
  const [dataUrl, setDataUrl] = React.useState<string | null>(null);
  const [svgStr, setSvgStr] = React.useState<string | null>(null);
  const [copiedPng, setCopiedPng] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const content = React.useMemo((): string => {
    try {
      switch (activeType) {
        case "url": return buildURL(urlData);
        case "text": return buildText(textData);
        case "email": return buildEmail(emailData);
        case "phone": return buildPhone(phoneData);
        case "sms": return buildSMS(smsData);
        case "wifi": return buildWifi(wifiData);
        case "vcard": return buildVCard(vcardData);
      }
    } catch { return ""; }
  }, [activeType, urlData, textData, emailData, phoneData, smsData, wifiData, vcardData]);

  React.useEffect(() => {
    if (!content.trim()) { setDataUrl(null); setSvgStr(null); setError(null); return; }
    const opts = { errorCorrectionLevel: ecl as QRCode.QRCodeErrorCorrectionLevel, color: { dark: fgColor, light: bgColor }, width: size, margin: 2 };
    Promise.all([
      QRCode.toDataURL(content, opts),
      QRCode.toString(content, { ...opts, type: "svg" as const }),
    ]).then(([du, svg]) => { setDataUrl(du); setSvgStr(svg); setError(null); })
      .catch((e) => setError((e as Error).message));
  }, [content, size, ecl, fgColor, bgColor]);

  async function handleDownloadPng() {
    if (!dataUrl) return;
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    downloadBlob(blob, "qrcode.png");
  }

  function handleDownloadSvg() {
    if (!svgStr) return;
    downloadText(svgStr, "qrcode.svg", "image/svg+xml");
  }

  async function handleCopyPng() {
    if (!dataUrl) return;
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopiedPng(true);
      setTimeout(() => setCopiedPng(false), 1500);
    } catch { /* ClipboardItem not supported in all browsers */ }
  }

  const contrast = React.useMemo(() => {
    function lum(hex: string) {
      const c = parseInt(hex.slice(1), 16);
      const r = ((c >> 16) & 255) / 255, g = ((c >> 8) & 255) / 255, b = (c & 255) / 255;
      const toLinear = (v: number) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    }
    const l1 = lum(fgColor), l2 = lum(bgColor);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }, [fgColor, bgColor]);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left: inputs */}
      <div className="flex-1 space-y-5 min-w-0">
        <Tabs value={activeType} onValueChange={(v) => setActiveType(v as TabType)} id="qr-type-tabs">
          <TabsList className="flex-wrap h-auto gap-1">
            {(["url", "text", "email", "phone", "sms", "wifi", "vcard"] as TabType[]).map((t) => (
              <TabsTrigger key={t} value={t} id={`qr-tab-${t}`} className="capitalize">{t === "vcard" ? "vCard" : t}</TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-4 space-y-3">
            <TabsContent value="url">
              <Field label="URL" id="qr-url" type="url" value={urlData.url} onChange={(v) => setUrlData({ url: v })} placeholder="https://example.com" />
            </TabsContent>

            <TabsContent value="text">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Text</label>
                <textarea
                  id="qr-text"
                  value={textData.text}
                  onChange={(e) => setTextData({ text: e.target.value })}
                  placeholder="Enter any text…"
                  className="w-full h-28 rounded-md border border-input bg-background px-3 py-2 text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-3">
              <Field label="To" id="qr-email-to" type="email" value={emailData.to} onChange={(v) => setEmailData((p) => ({ ...p, to: v }))} placeholder="user@example.com" />
              <Field label="Subject" id="qr-email-subject" value={emailData.subject} onChange={(v) => setEmailData((p) => ({ ...p, subject: v }))} placeholder="Hello…" />
              <Field label="Body" id="qr-email-body" value={emailData.body} onChange={(v) => setEmailData((p) => ({ ...p, body: v }))} placeholder="Message…" />
            </TabsContent>

            <TabsContent value="phone">
              <Field label="Phone number" id="qr-phone" type="tel" value={phoneData.phone} onChange={(v) => setPhoneData({ phone: v })} placeholder="+1 555 000 0000" />
            </TabsContent>

            <TabsContent value="sms" className="space-y-3">
              <Field label="Phone number" id="qr-sms-phone" type="tel" value={smsData.phone} onChange={(v) => setSmsData((p) => ({ ...p, phone: v }))} placeholder="+1 555 000 0000" />
              <Field label="Message (optional)" id="qr-sms-msg" value={smsData.message} onChange={(v) => setSmsData((p) => ({ ...p, message: v }))} placeholder="Hi there!" />
            </TabsContent>

            <TabsContent value="wifi" className="space-y-3">
              <Field label="Network name (SSID)" id="qr-wifi-ssid" value={wifiData.ssid} onChange={(v) => setWifiData((p) => ({ ...p, ssid: v }))} placeholder="MyWiFiNetwork" />
              <Field label="Password" id="qr-wifi-pwd" type="password" value={wifiData.password} onChange={(v) => setWifiData((p) => ({ ...p, password: v }))} placeholder="••••••••" />
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Security</label>
                <Select value={wifiData.security} onValueChange={(v) => setWifiData((p) => ({ ...p, security: v as "WPA" | "WEP" | "nopass" }))}>
                  <SelectTrigger id="qr-wifi-security" className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WPA">WPA/WPA2</SelectItem>
                    <SelectItem value="WEP">WEP</SelectItem>
                    <SelectItem value="nopass">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input type="checkbox" checked={wifiData.hidden} onChange={(e) => setWifiData((p) => ({ ...p, hidden: e.target.checked }))} className="rounded" id="qr-wifi-hidden" />
                Hidden network
              </label>
            </TabsContent>

            <TabsContent value="vcard" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Full name" id="qr-vcard-name" value={vcardData.name} onChange={(v) => setVcardData((p) => ({ ...p, name: v }))} placeholder="Jane Doe" className="col-span-2" />
                <Field label="Phone" id="qr-vcard-phone" type="tel" value={vcardData.phone} onChange={(v) => setVcardData((p) => ({ ...p, phone: v }))} placeholder="+1 555…" />
                <Field label="Email" id="qr-vcard-email" type="email" value={vcardData.email} onChange={(v) => setVcardData((p) => ({ ...p, email: v }))} placeholder="jane@…" />
                <Field label="Organisation" id="qr-vcard-org" value={vcardData.org} onChange={(v) => setVcardData((p) => ({ ...p, org: v }))} placeholder="Acme Inc." />
                <Field label="Website" id="qr-vcard-url" type="url" value={vcardData.url} onChange={(v) => setVcardData((p) => ({ ...p, url: v }))} placeholder="https://…" />
                <Field label="Note" id="qr-vcard-note" value={vcardData.note} onChange={(v) => setVcardData((p) => ({ ...p, note: v }))} placeholder="Optional note…" className="col-span-2" />
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Settings */}
        <div className="rounded-lg border border-border/60 bg-card px-4 py-4 space-y-4">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Settings</span>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Size</span>
              <span className="font-mono text-primary">{size}px</span>
            </div>
            <Slider id="qr-size" min={128} max={1024} step={128} value={[size]} onValueChange={([v]) => setSize(v)} />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              {[128, 256, 512, 1024].map((s) => <span key={s}>{s}</span>)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Error correction</label>
              <Select value={ecl} onValueChange={(v) => setEcl(v as ECL)}>
                <SelectTrigger id="qr-ecl" className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["L", "M", "Q", "H"] as ECL[]).map((l) => <SelectItem key={l} value={l}>{ECL_LABELS[l]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Contrast {contrast < 3 && <span className="text-amber-500 ml-1">Low ⚠</span>}
              </label>
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5">
                      <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} id="qr-fg-color" className="h-9 w-9 rounded cursor-pointer border border-border" title="Foreground" />
                      <span className="text-[10px] text-muted-foreground">FG</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Foreground (dark modules)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5">
                      <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} id="qr-bg-color" className="h-9 w-9 rounded cursor-pointer border border-border" title="Background" />
                      <span className="text-[10px] text-muted-foreground">BG</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Background</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Preview */}
      <div className="lg:w-72 space-y-4">
        <div className="sticky top-20">
          <div className="rounded-lg border border-border/60 bg-card p-4 space-y-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Preview</span>
            <div
              className="rounded-lg flex items-center justify-center aspect-square w-full overflow-hidden"
              style={{ backgroundColor: bgColor }}
              id="qr-preview"
            >
              {dataUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={dataUrl} alt="QR Code" className="w-full h-full object-contain" />
              ) : (
                <p className="text-xs text-muted-foreground text-center px-4">
                  {error ? <span className="text-destructive text-[10px]">{error}</span> : "Fill in the fields to generate a QR code."}
                </p>
              )}
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}

            {dataUrl && (
              <div className="space-y-2">
                <Button className="w-full" onClick={handleDownloadPng} id="qr-download-png">
                  <Download className="h-4 w-4" /> Download PNG
                </Button>
                <Button variant="outline" className="w-full" onClick={handleDownloadSvg} id="qr-download-svg">
                  <Download className="h-4 w-4" /> Download SVG
                </Button>
                <Button variant="ghost" className="w-full" onClick={handleCopyPng} id="qr-copy-png">
                  {copiedPng ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  {copiedPng ? "Copied!" : "Copy to clipboard"}
                </Button>
                <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => { setUrlData({ url: "" }); setTextData({ text: "" }); }} id="qr-reset">
                  <RotateCcw className="h-3 w-3" /> Reset
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
