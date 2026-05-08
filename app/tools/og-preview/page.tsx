import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { OgPreviewTool } from './OgPreviewTool';
export const metadata: Metadata = { title: 'Open Graph Preview — kit', description: 'Preview how any URL looks when shared on Facebook, Twitter, and LinkedIn. Inspect OG meta tags.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/og-preview' } };
export default function Page() { return <ToolShell toolId='og-preview'><OgPreviewTool /></ToolShell>; }
