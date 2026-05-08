import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { RandomColorTool } from './RandomColorTool';
export const metadata: Metadata = { title: 'Random Colour Generator — kit', description: 'Generate harmonious colour palettes: analogous, triadic, monochromatic, neon and more.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/random-color' } };
export default function Page() { return <ToolShell toolId='random-color'><RandomColorTool /></ToolShell>; }
