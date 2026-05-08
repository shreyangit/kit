import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { BarcodeGeneratorTool } from './BarcodeGeneratorTool';
export const metadata: Metadata = { title: 'Barcode Generator — kit', description: 'Generate CODE128, EAN-13, QR, UPC and more. Download as SVG or high-resolution PNG.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/barcode-generator' } };
export default function Page() { return <ToolShell toolId='barcode-generator'><BarcodeGeneratorTool /></ToolShell>; }
