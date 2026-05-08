import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { JwtGeneratorTool } from './JwtGeneratorTool';
export const metadata: Metadata = { title: 'JWT Generator — kit', description: 'Sign and verify JSON Web Tokens with HS256/RS256. Colour-coded token preview, verify tab.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/jwt-generator' } };
export default function Page() { return <ToolShell toolId='jwt-generator'><JwtGeneratorTool /></ToolShell>; }
