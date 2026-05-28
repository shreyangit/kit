import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { PomodoroTool } from './PomodoroTool';
export const metadata: Metadata = { title: 'Pomodoro Timer — kit', description: 'Drift-free, background-safe Pomodoro timer with auto-start, desktop notifications, bell sound, persistent daily focus stats, keyboard shortcuts, and configurable durations.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/pomodoro' } };
export default function PomodoroPage() { return <ToolShell toolId='pomodoro'><PomodoroTool /></ToolShell>; }
