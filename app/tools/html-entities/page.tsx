import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { HtmlEntitiesTool } from './HtmlEntitiesTool';
export const metadata: Metadata = { title: 'HTML Entity Encoder / Decoder — kit', description: 'Encode and decode HTML entities in Basic, Named, and Numeric modes. Searchable entity reference table. Swap mode and insert-to-input for quick editing.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/html-entities' } };
export default function HtmlEntitiesPage() { return <ToolShell toolId='html-entities'><HtmlEntitiesTool /></ToolShell>; }
