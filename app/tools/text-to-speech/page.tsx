import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { TextToSpeechTool } from './TextToSpeechTool';
export const metadata: Metadata = { title: 'Text to Speech — kit', description: 'Convert text to speech in your browser using Web Speech API. Choose voice, adjust rate, pitch, and volume. Works offline — no data sent.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/text-to-speech' } };
export default function TextToSpeechPage() { return <ToolShell toolId='text-to-speech'><TextToSpeechTool /></ToolShell>; }
