import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { TimezoneConverterTool } from './TimezoneConverterTool';
export const metadata: Metadata = { title: 'Timezone Converter — kit', description: 'Convert date and time across any IANA timezone instantly. Powered by native Intl.DateTimeFormat — no library, always DST-accurate. Add/remove target timezones.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/timezone-converter' } };
export default function TimezoneConverterPage() { return <ToolShell toolId='timezone-converter'><TimezoneConverterTool /></ToolShell>; }
