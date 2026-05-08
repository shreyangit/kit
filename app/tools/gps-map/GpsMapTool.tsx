"use client";
import * as React from "react";
import { Upload, Copy, Check, MapPin, Camera, Navigation, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExifData {
  latitude: number; longitude: number; altitude?: number; direction?: number;
  dateTaken?: Date; camera?: string; imageUrl: string;
}

function toDMS(decimal: number, isLat: boolean): string {
  const abs = Math.abs(decimal);
  const d = Math.floor(abs);
  const mf = (abs - d) * 60;
  const m = Math.floor(mf);
  const s = ((mf - m) * 60).toFixed(2);
  const dir = isLat ? (decimal >= 0 ? "N" : "S") : (decimal >= 0 ? "E" : "W");
  return `${d}° ${m}' ${s}" ${dir}`;
}

declare global { interface Window { L?: unknown; } }

function LeafletMap({ lat, lng, imageUrl }: { lat: number; lng: number; imageUrl: string }) {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const instanceRef = React.useRef<unknown>(null);

  React.useEffect(() => {
    if (!mapRef.current || instanceRef.current) return;
    const loadLeaflet = async () => {
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css"; link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      if (!(window as Window & { L?: unknown }).L) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          s.onload = () => res(); s.onerror = () => rej(new Error("Leaflet failed"));
          document.head.appendChild(s);
        });
      }
      const L = (window as Window & { L?: { map: (el: Element, opts: unknown) => unknown; tileLayer: (url: string, opts: unknown) => { addTo: (m: unknown) => void }; marker: (coords: [number, number], opts?: unknown) => { addTo: (m: unknown) => { bindPopup: (s: string) => { openPopup: () => void } } }; divIcon: (opts: unknown) => unknown } }).L!;
      const map = L.map(mapRef.current!, { zoomControl: true }) as { setView: (c: [number,number], z: number) => void; remove: () => void };
      (map as unknown as { setView: (c: [number,number], z: number) => void }).setView([lat, lng], 15);
      instanceRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors", maxZoom: 19 }).addTo(map);
      const icon = L.divIcon({ html: `<div style="width:44px;height:44px;border-radius:50%;border:3px solid white;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.4)"><img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover"/></div>`, iconSize: [44,44], iconAnchor: [22,22] });
      L.marker([lat, lng] as [number,number], { icon }).addTo(map).bindPopup(`<b>Photo Location</b><br>${lat.toFixed(6)}°, ${lng.toFixed(6)}°`).openPopup();
    };
    loadLeaflet().catch(console.error);
    return () => { if (instanceRef.current) { (instanceRef.current as { remove: () => void }).remove(); instanceRef.current = null; } };
  }, [lat, lng, imageUrl]);

  return <div ref={mapRef} style={{ height: "360px", width: "100%", borderRadius: "8px" }} />;
}

export function GpsMapTool() {
  const [exif, setExif] = React.useState<ExifData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setLoading(true); setError(null); setExif(null);
    try {
      const exifr = await import("exifr");
      const [gps, meta] = await Promise.all([
        exifr.gps(file),
        exifr.parse(file, ["Make", "Model", "DateTimeOriginal", "GPSAltitude", "GPSImgDirection"]),
      ]);
      if (!gps?.latitude || !gps?.longitude) {
        setError("No GPS data found in this image. GPS is usually present in smartphone photos with location enabled.");
        setLoading(false); return;
      }
      const imageUrl = URL.createObjectURL(file);
      setExif({
        latitude: gps.latitude, longitude: gps.longitude,
        altitude: meta?.GPSAltitude, direction: meta?.GPSImgDirection,
        dateTaken: meta?.DateTimeOriginal, camera: [meta?.Make, meta?.Model].filter(Boolean).join(" ") || undefined,
        imageUrl,
      });
    } catch (e) { setError((e as Error).message); }
    setLoading(false);
  }

  async function copyCoords() {
    if (!exif) return;
    await navigator.clipboard.writeText(`${exif.latitude.toFixed(6)},${exif.longitude.toFixed(6)}`);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Upload */}
      <button onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        className="w-full rounded-lg border-2 border-dashed border-border/60 bg-secondary/10 hover:border-foreground/20 py-10 flex flex-col items-center gap-2 cursor-pointer transition-colors" id="gps-dropzone">
        <MapPin className="h-7 w-7 text-muted-foreground" />
        <p className="text-sm font-medium">Drop image or tap to select</p>
        <p className="text-xs text-muted-foreground">JPG, HEIC, TIFF — must have GPS EXIF data</p>
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-3.5 w-3.5 rounded-full border-2 border-border border-t-foreground animate-spin inline-block" />Reading EXIF data…
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-border/60 bg-card px-4 py-4 text-center space-y-1">
          <MapPin className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground/60 mt-2">Tip: Most smartphone photos have GPS when location permission is granted. Screenshots and downloaded images usually don't.</p>
        </div>
      )}

      {exif && (
        <div className="space-y-4">
          {/* Map */}
          <LeafletMap lat={exif.latitude} lng={exif.longitude} imageUrl={exif.imageUrl} />

          {/* Photo thumbnail + metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <img src={exif.imageUrl} alt="Uploaded" className="w-full h-40 object-cover rounded-lg border border-border/60" />
            <div className="rounded-lg border border-border/60 bg-card px-4 py-3 space-y-2">
              <div className="space-y-1.5">
                {[
                  ["Latitude", toDMS(exif.latitude, true)],
                  ["Longitude", toDMS(exif.longitude, false)],
                  ["Decimal", `${exif.latitude.toFixed(6)}, ${exif.longitude.toFixed(6)}`],
                  exif.altitude ? ["Altitude", `${exif.altitude.toFixed(0)} m`] : null,
                  exif.direction ? ["Direction", `${exif.direction.toFixed(0)}° (${["N","NE","E","SE","S","SW","W","NW"][Math.round(exif.direction / 45) % 8]})`] : null,
                  exif.camera ? ["Camera", exif.camera] : null,
                  exif.dateTaken ? ["Date Taken", exif.dateTaken.toLocaleString()] : null,
                ].filter((x): x is [string, string] => x !== null).map(([label, value]) => (
                  <div key={label as string} className="flex items-start gap-2">
                    <span className="text-[11px] text-muted-foreground w-20 shrink-0 mt-px">{label as string}</span>
                    <span className="text-xs font-mono break-all">{value as string}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={copyCoords} className="gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}Copy coordinates
            </Button>
            <a href={`https://maps.google.com/?q=${exif.latitude},${exif.longitude}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5"><ExternalLink className="h-3.5 w-3.5" />Google Maps</Button>
            </a>
            <a href={`https://maps.apple.com/?ll=${exif.latitude},${exif.longitude}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5"><Navigation className="h-3.5 w-3.5" />Apple Maps</Button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
