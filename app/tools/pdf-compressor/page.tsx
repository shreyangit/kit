import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { PdfCompressorTool } from './PdfCompressorTool';
export const metadata: Metadata = { title: 'PDF Compressor — kit', description: 'Compress PDF files by rasterising pages to JPEG. Configurable quality and DPI. All processing happens in your browser — no upload.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/pdf-compressor' } };
export default function PdfCompressorPage() { return <ToolShell toolId='pdf-compressor'><PdfCompressorTool /></ToolShell>; }
