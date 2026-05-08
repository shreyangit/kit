import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { BoxShadowTool } from './BoxShadowTool';
export const metadata: Metadata = { title: 'CSS Box Shadow Generator — kit', description: 'Build CSS box shadows with up to 8 layers. Live preview, presets, CSS and Tailwind output.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/box-shadow' } };
export default function Page() { return <ToolShell toolId='box-shadow'><BoxShadowTool /></ToolShell>; }
