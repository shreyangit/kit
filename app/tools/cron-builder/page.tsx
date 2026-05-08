import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { CronBuilderTool } from './CronBuilderTool';
export const metadata: Metadata = { title: 'Cron Expression Builder — kit', description: 'Build cron schedules visually or manually. Human-readable description and next 5 run times.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/cron-builder' } };
export default function Page() { return <ToolShell toolId='cron-builder'><CronBuilderTool /></ToolShell>; }
