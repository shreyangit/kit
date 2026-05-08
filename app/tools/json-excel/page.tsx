import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { JsonExcelTool } from './JsonExcelTool';
export const metadata: Metadata = { title: 'JSON ↔ Excel Converter — kit', description: 'Convert JSON arrays to Excel (.xlsx) or CSV, and Excel files back to JSON. Nested object flattening, live table preview. Fully client-side.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/json-excel' } };
export default function JsonExcelPage() { return <ToolShell toolId='json-excel'><JsonExcelTool /></ToolShell>; }
