import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { ExifViewerTool } from './ExifViewerTool';
export const metadata: Metadata = { title: 'EXIF Data Viewer & Remover — kit', description: 'View embedded EXIF, GPS, IPTC and XMP metadata in your images. Remove all metadata in one click to protect your privacy. 100% client-side.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/exif-viewer' } };
export default function ExifViewerPage() { return <ToolShell toolId='exif-viewer'><ExifViewerTool /></ToolShell>; }
