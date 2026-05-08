import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { AudioConverterTool } from './AudioConverterTool';
export const metadata: Metadata = { title: 'Audio Format Converter — kit', description: 'Convert MP3, WAV, OGG, FLAC, AAC, M4A, OPUS in your browser using FFmpeg WASM. No uploads.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/audio-converter' } };
export default function Page() { return <ToolShell toolId='audio-converter'><AudioConverterTool /></ToolShell>; }
