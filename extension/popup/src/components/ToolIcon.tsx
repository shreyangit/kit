// Renders a Lucide icon by name as an inline SVG.
// No emoji anywhere — this is the single source of truth for icons in the popup.
import React from 'react'

const PATHS: Record<string, string> = {
  Image: 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7m4-2h6v6m-11 5L21 3',
  FileText: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  Code2: 'M18 16l4-4-4-4M6 8l-4 4 4 4M14.5 4l-5 16',
  Play: 'M5 3l14 9-14 9V3z',
  Palette: 'M12 2a10 10 0 1 0 10 10c0-2.76-2.24-5-5-5a5 5 0 0 1-5-5A10 10 0 0 0 2 12',
  Database: 'M12 2C6.48 2 2 4.24 2 7s4.48 5 10 5 10-2.24 10-5-4.48-5-10-5zM2 17c0 2.76 4.48 5 10 5s10-2.24 10-5M2 12c0 2.76 4.48 5 10 5s10-2.24 10-5',
  Globe: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  ShieldCheck: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
  Zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  PenLine: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z',
  Scissors: 'M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12',
  PackageOpen: 'M20.91 8.84L8.56 2.23a1 1 0 0 0-.87 0L3.1 4.13a1 1 0 0 0-.5 1.28L15 17.41M15.5 17.5l-3 1.5-9-4.5V8l9-4.5 9 4.5v5',
  RefreshCw: 'M21 2v6h-6M3 22v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L21 8M3 16l2.64 2.36A9 9 0 0 0 20.49 15',
  Scaling: 'M15 3h6v6M14 10l6.1-6.1M9 21H3v-6M10 14l-6.1 6.1',
  FileOutput: 'M4 2h10l6 6v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM14 2v6h6M9 18l3 3 3-3M12 12v9',
  ScanText: 'M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8h8M7 12h8M7 16h5',
  Droplets: 'M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05zM12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97',
  Info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8h.01M11 12h1v4h1',
  Star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  ScanBarcode: 'M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M8 7v10M12 7v10M17 7v10',
  QrCode: 'M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM11 11h4v4h-4zM15 15h6v2h-6zM15 19h6v2h-6z',
  MapPin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  FilePlus2: 'M4 2h10l6 6v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm6 13v-6m-3 3h6',
  FileImage: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M12 18l-3-3.2-2 2.5L5 14h14',
  FileDown: 'M4 2h10l6 6v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm8 14l-3 3 3 3m0-6v6',
  Braces: 'M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1M16 21h1a2 2 0 0 0 2-2v-5a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1',
  Binary: 'M6 20V4m-2 4h4M6 12H4m2 4H4M18 20V4m-2 4h4m-4 4h4m-4 4h4',
  Link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  Code: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
  KeyRound: 'M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4L2 18zM17.5 9.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z',
  Key: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
  Search: 'M21 21l-4.35-4.35M17 11A6 6 0 1 0 5 11a6 6 0 0 0 12 0z',
  GitDiff: 'M12 3v14M5 10l7-7 7 7M5 21h4m6 0h4M15 21v-4',
  FileCode: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M10 13l-2 2 2 2M14 13l2 2-2 2',
  Table: 'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18',
  Type: 'M4 7V4h16v3M9 20h6M12 4v16',
  AlignLeft: 'M3 6h18M3 12h12M3 18h15',
  Hash: 'M4 9h16M4 15h16M10 3L8 21M16 3l-2 18',
  Link2: 'M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2M11 12h2',
  BookOpen: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
  Clapperboard: 'M4 11v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V11M4 11H2m2 0h16m0 0h2M4 11l2-7h12l2 7M12 11v10M7 5l-1 6M17 5l1 6',
  Music: 'M9 18V5l12-2v13M9 18a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM21 16a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  Mic: 'M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8',
  Volume2: 'M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07',
  Droplet: 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z',
  Contrast: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 0v20M12 6a6 6 0 0 1 0 12V6z',
  Layers: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  Square: 'M3 3h18v18H3z',
  RectangleHorizontal: 'M2 7h20v10H2z',
  Maximize2: 'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7',
  Shuffle: 'M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5',
  PlayCircle: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM10 8l6 4-6 4V8z',
  Grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  PenTool: 'M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z',
  ArrowLeftRight: 'M21 16H3m18 0l-4 4m4-4-4-4M3 8h18M3 8l4 4M3 8l4-4',
  Sheet: 'M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM2 7h20M7 2v20',
  FlaskConical: 'M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2M8.5 2h7',
  Timer: 'M10 2h4M12 14l3-3M12 6a8 8 0 1 0 0 16 8 8 0 0 0 0-16z',
  Tag: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01',
  Map: 'M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zM8 2v16M16 6v16',
  Bot: 'M12 8V4H8M12 8h4M12 8H8M16 8a4 4 0 0 1 0 8H8a4 4 0 0 1 0-8M9 13h.01M15 13h.01',
  Smartphone: 'M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM12 18h.01',
  ServerCrash: 'M6 2h12a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM4 10h16M6 14h2M12 14h2M4 18h12a2 2 0 0 0 2-2v-2H4v2a2 2 0 0 0 .5 1.3l1.5 2 1.5-2',
  Lock: 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4',
  Fingerprint: 'M2 13.5V12a10 10 0 0 1 10-10M5.5 15.5A9.98 9.98 0 0 1 5 12a7 7 0 0 1 7-7M20 17a10 10 0 0 1-8.5 4.9M22 13.5V12a10 10 0 0 0-1.3-5M12 5a7 7 0 0 1 7 7v.5M12 9a3 3 0 0 1 3 3v5M9 12a3 3 0 0 0 3 3',
  Ruler: 'M1 12h6l2-3 4 6 2-3h8M1 20l4-8 4 8M15 4l4 8 4-8',
  Globe2: 'M21.54 15H17a2 2 0 0 0-2 2v4.54M7 3.34V5a3 3 0 0 0 3 3 2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17M11 21.95V18a2 2 0 0 0-2-2 2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z',
  Clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  CalendarClock: 'M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7.5M16 2v4M8 2v4M3 10h8M17.5 17.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM17.5 14.5V12l1.5 1.5',
  Network: 'M9 2h6M12 2v5M12 7a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM3 20l3-3M21 20l-3-3',
  Keyboard: 'M2 5h20v14H2zM6 9h.01M10 9h.01M14 9h.01M18 9h.01M8 13h.01M12 13h.01M16 13h.01M7 17h10',
  Cpu: 'M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3M7 7h10v10H7z',
  Wifi: 'M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01',
  Radio: 'M4.9 19.1C1 15.2 1 8.8 4.9 4.9M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5M12 12h.01M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5M19.1 4.9C23 8.8 23 15.1 19.1 19',
}

interface Props {
  name: string
  size?: number
  color?: string
  className?: string
}

export function ToolIcon({ name, size = 16, color = 'currentColor', className }: Props) {
  const d = PATHS[name]
  if (!d) {
    // Fallback: render a generic square
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  )
}
