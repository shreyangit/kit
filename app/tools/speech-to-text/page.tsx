import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { SpeechToTextTool } from './SpeechToTextTool';
export const metadata: Metadata = { title: 'Speech to Text — kit', description: 'Transcribe speech to text in real-time using your microphone. 20+ languages, continuous mode, live interim results. Chrome and Edge only.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/speech-to-text' } };
export default function SpeechToTextPage() { return <ToolShell toolId='speech-to-text'><SpeechToTextTool /></ToolShell>; }
