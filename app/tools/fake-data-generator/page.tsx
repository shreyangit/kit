import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { FakeDataGeneratorTool } from './FakeDataGeneratorTool';
export const metadata: Metadata = { title: 'Fake Data Generator — kit', description: 'Generate realistic test data: names, emails, UUIDs, addresses. Export as JSON, CSV, SQL or TypeScript.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/fake-data-generator' } };
export default function Page() { return <ToolShell toolId='fake-data-generator'><FakeDataGeneratorTool /></ToolShell>; }
