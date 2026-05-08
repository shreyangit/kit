import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { CodeFormatterTool } from './CodeFormatterTool';
export const metadata: Metadata = { title: 'Code Formatter / Beautifier — kit', description: 'Format JS, TS, JSON, CSS, HTML, Markdown via Prettier. Loaded lazily from CDN.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/code-formatter' } };
export default function Page() { return <ToolShell toolId='code-formatter'><CodeFormatterTool /></ToolShell>; }
