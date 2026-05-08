import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { AspectRatioTool } from './AspectRatioTool';
export const metadata: Metadata = { title: 'Aspect Ratio Calculator — kit', description: 'Calculate and simplify aspect ratios. Find equivalent resolutions, detect named ratios (16:9, 4:3, etc), and compute missing dimensions. Fully offline.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/aspect-ratio' } };
export default function AspectRatioPage() { return <ToolShell toolId='aspect-ratio'><AspectRatioTool /></ToolShell>; }
