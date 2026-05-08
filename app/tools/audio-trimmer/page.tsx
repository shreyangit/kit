import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { AudioTrimmerTool } from './AudioTrimmerTool';
export const metadata: Metadata = { title: 'Audio Trimmer — kit', description: 'Trim audio with a waveform editor. Lossless trim using FFmpeg -c copy. Preview selection before trimming.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/audio-trimmer' } };
export default function Page() { return <ToolShell toolId='audio-trimmer'><AudioTrimmerTool /></ToolShell>; }
