import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { FaviconGeneratorTool } from './FaviconGeneratorTool';
export const metadata: Metadata = { title: 'Favicon Generator — kit', description: 'Generate all favicon sizes from one image: 7 PNGs, a .ico file, PWA manifest, and an HTML snippet — all in a ZIP. Canvas-based, no upload.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/favicon-generator' } };
export default function FaviconGeneratorPage() { return <ToolShell toolId='favicon-generator'><FaviconGeneratorTool /></ToolShell>; }
