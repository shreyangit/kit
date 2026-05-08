import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { ImageToPdfTool } from './ImageToPdfTool';
export const metadata: Metadata = { title: 'Image to PDF — kit', description: 'Convert multiple images into a single PDF. Control page size, orientation, fit and margins.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/image-to-pdf' } };
export default function Page() { return <ToolShell toolId='image-to-pdf'><ImageToPdfTool /></ToolShell>; }
