import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { BorderRadiusTool } from './BorderRadiusTool';
export const metadata: Metadata = { title: 'CSS Border Radius Visualiser — kit', description: 'Design border-radius with per-corner sliders. Linked or independent mode, px and % units.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/border-radius' } };
export default function Page() { return <ToolShell toolId='border-radius'><BorderRadiusTool /></ToolShell>; }
