import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { RobotsTxtTool } from './RobotsTxtTool';
export const metadata: Metadata = { title: 'robots.txt Generator — kit', description: 'Build robots.txt rules visually. Bot presets, quick templates, validation warnings.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/robots-txt' } };
export default function Page() { return <ToolShell toolId='robots-txt'><RobotsTxtTool /></ToolShell>; }
