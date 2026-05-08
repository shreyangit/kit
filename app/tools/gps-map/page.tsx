import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { GpsMapTool } from './GpsMapTool';
export const metadata: Metadata = { title: 'Image GPS Map (EXIF) — kit', description: 'View photo location on an interactive map. Extracts GPS EXIF data from any photo.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/gps-map' } };
export default function Page() { return <ToolShell toolId='gps-map'><GpsMapTool /></ToolShell>; }
