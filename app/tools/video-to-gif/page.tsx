import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { VideoToGifTool } from './VideoToGifTool';
export const metadata: Metadata = { title: 'Video to GIF Converter — kit', description: 'Convert any video clip to an animated GIF or WebP. Two-pass GIF generation with palette optimisation.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/video-to-gif' } };
export default function Page() { return <ToolShell toolId='video-to-gif'><VideoToGifTool /></ToolShell>; }
