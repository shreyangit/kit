import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { ImageWatermarkTool } from './ImageWatermarkTool';
export const metadata: Metadata = { title: 'Image Watermark — kit', description: 'Add text or logo watermarks to images. 7 position presets, opacity, angle, tiled mode. Canvas-based — your images never leave your device.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/image-watermark' } };
export default function ImageWatermarkPage() { return <ToolShell toolId='image-watermark'><ImageWatermarkTool /></ToolShell>; }
