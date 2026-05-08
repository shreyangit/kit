import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { UnixTimestampTool } from './UnixTimestampTool';
export const metadata: Metadata = { title: 'Unix Timestamp Converter — kit', description: 'Convert Unix timestamps to dates and back. Live mode, 6 timezones, relative time.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/unix-timestamp' } };
export default function Page() { return <ToolShell toolId='unix-timestamp'><UnixTimestampTool /></ToolShell>; }
