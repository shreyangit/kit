import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { ColorContrastTool } from './ColorContrastTool';
export const metadata: Metadata = { title: 'Color Contrast Checker — kit', description: 'Check WCAG 2.1 contrast ratio between foreground and background colors. Live preview with AA/AAA compliance for normal and large text.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/color-contrast' } };
export default function ColorContrastPage() { return <ToolShell toolId='color-contrast'><ColorContrastTool /></ToolShell>; }
