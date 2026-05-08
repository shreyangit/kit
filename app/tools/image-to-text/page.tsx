import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { ImageToTextTool } from './ImageToTextTool';
export const metadata: Metadata = { title: 'Image to Text (OCR) — kit', description: 'Extract text from images using Tesseract.js OCR. Supports 10 languages. Runs fully in your browser — images are never uploaded.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/image-to-text' } };
export default function ImageToTextPage() { return <ToolShell toolId='image-to-text'><ImageToTextTool /></ToolShell>; }
