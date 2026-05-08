import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { SvgOptimizerTool } from './SvgOptimizerTool';
export const metadata: Metadata = { title: 'SVG Optimizer — kit', description: 'Optimise SVG files with SVGO in your browser. Remove comments, metadata, hidden elements. Side-by-side preview. Up to 80% size reduction.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/svg-optimizer' } };
export default function SvgOptimizerPage() { return <ToolShell toolId='svg-optimizer'><SvgOptimizerTool /></ToolShell>; }
