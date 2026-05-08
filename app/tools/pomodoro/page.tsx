import type { Metadata } from 'next';
import { ToolShell } from '@/components/tool-shell/ToolShell';
import { PomodoroTool } from './PomodoroTool';
export const metadata: Metadata = { title: 'Pomodoro Timer — kit', description: 'Productivity timer with 25/5/15 minute cycles. SVG progress ring, bell sound, tab title countdown, keyboard shortcuts, configurable durations and session counts.', alternates: { canonical: 'https://kit.shreyannarula.com/tools/pomodoro' } };
export default function PomodoroPage() { return <ToolShell toolId='pomodoro'><PomodoroTool /></ToolShell>; }
