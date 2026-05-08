import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { MetaTagGeneratorTool } from './MetaTagGeneratorTool';
export const metadata: Metadata = { title: 'Meta Tag Generator — kit', description: 'Generate SEO meta tags for OpenGraph, Twitter Cards, and more. Live social preview.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/meta-tag-generator' } };
export default function Page() { return <ToolShell toolId='meta-tag-generator'><MetaTagGeneratorTool /></ToolShell>; }
