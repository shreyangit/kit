import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { IpLookupTool } from './IpLookupTool';
export const metadata: Metadata = { title: 'IP Address Lookup — kit', description: 'Look up geolocation, ISP, ASN, timezone, currency and more for any IPv4/IPv6 address. Provider fallback, distance-from-you, map, recent history, and copy-as-JSON. Auto-detects your IP.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/ip-lookup' } };
export default function Page() { return <ToolShell toolId='ip-lookup'><IpLookupTool /></ToolShell>; }
