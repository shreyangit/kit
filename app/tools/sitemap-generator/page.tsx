import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { SitemapGeneratorTool } from './SitemapGeneratorTool';
export const metadata: Metadata = { title: 'Sitemap XML Generator — kit', description: 'Generate sitemap.xml from a list of URLs. Changefreq, priority, lastmod control.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/sitemap-generator' } };
export default function Page() { return <ToolShell toolId='sitemap-generator'><SitemapGeneratorTool /></ToolShell>; }
