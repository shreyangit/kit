import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { MarkdownTableTool } from './MarkdownTableTool';
export const metadata: Metadata = { title: 'Markdown Table Generator — kit', description: 'Create Markdown tables in a visual grid. CSV import, alignment, HTML output.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/markdown-table' } };
export default function Page() { return <ToolShell toolId='markdown-table'><MarkdownTableTool /></ToolShell>; }
