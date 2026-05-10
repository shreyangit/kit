"use client";
import * as React from "react";

const SHORTCUTS: { os: string; category: string; shortcuts: { keys: string[]; action: string }[] }[] = [
  { os: 'Universal', category: 'Text editing', shortcuts: [
    { keys: ['Ctrl', 'C'], action: 'Copy' }, { keys: ['Ctrl', 'X'], action: 'Cut' }, { keys: ['Ctrl', 'V'], action: 'Paste' },
    { keys: ['Ctrl', 'Z'], action: 'Undo' }, { keys: ['Ctrl', 'Y'], action: 'Redo' }, { keys: ['Ctrl', 'A'], action: 'Select all' },
    { keys: ['Ctrl', 'F'], action: 'Find' }, { keys: ['Ctrl', 'H'], action: 'Find & Replace' }, { keys: ['Ctrl', 'S'], action: 'Save' },
    { keys: ['Ctrl', 'P'], action: 'Print' }, { keys: ['Ctrl', 'N'], action: 'New' }, { keys: ['Ctrl', 'O'], action: 'Open' },
    { keys: ['Ctrl', 'W'], action: 'Close tab/window' }, { keys: ['Ctrl', 'T'], action: 'New tab' },
  ]},
  { os: 'Chrome', category: 'Browser', shortcuts: [
    { keys: ['Ctrl', 'Tab'], action: 'Next tab' }, { keys: ['Ctrl', 'Shift', 'Tab'], action: 'Previous tab' },
    { keys: ['Ctrl', 'L'], action: 'Focus address bar' }, { keys: ['Ctrl', 'D'], action: 'Bookmark page' },
    { keys: ['Ctrl', 'Shift', 'N'], action: 'Incognito window' }, { keys: ['Ctrl', 'R'], action: 'Refresh' },
    { keys: ['F12'], action: 'Open DevTools' }, { keys: ['Ctrl', 'Shift', 'J'], action: 'Console' },
    { keys: ['Ctrl', 'Shift', 'I'], action: 'DevTools' }, { keys: ['Ctrl', 'U'], action: 'View source' },
    { keys: ['Ctrl', '+'], action: 'Zoom in' }, { keys: ['Ctrl', '-'], action: 'Zoom out' }, { keys: ['Ctrl', '0'], action: 'Reset zoom' },
  ]},
  { os: 'VS Code', category: 'Editor', shortcuts: [
    { keys: ['Ctrl', 'Shift', 'P'], action: 'Command palette' }, { keys: ['Ctrl', '`'], action: 'Toggle terminal' },
    { keys: ['Ctrl', 'B'], action: 'Toggle sidebar' }, { keys: ['Alt', 'Click'], action: 'Multi-cursor' },
    { keys: ['Ctrl', 'D'], action: 'Select next occurrence' }, { keys: ['Ctrl', 'Shift', 'K'], action: 'Delete line' },
    { keys: ['Alt', '↑'], action: 'Move line up' }, { keys: ['Alt', '↓'], action: 'Move line down' },
    { keys: ['Ctrl', '/'], action: 'Toggle comment' }, { keys: ['Ctrl', 'Shift', 'F'], action: 'Search in files' },
    { keys: ['F2'], action: 'Rename symbol' }, { keys: ['F12'], action: 'Go to definition' },
    { keys: ['Ctrl', 'Shift', '`'], action: 'New terminal' }, { keys: ['Ctrl', 'K', 'Ctrl', 'C'], action: 'Add line comment' },
  ]},
  { os: 'macOS', category: 'System', shortcuts: [
    { keys: ['Cmd', 'Space'], action: 'Spotlight search' }, { keys: ['Cmd', 'Tab'], action: 'Switch apps' },
    { keys: ['Cmd', '`'], action: 'Switch windows (same app)' }, { keys: ['Cmd', 'Q'], action: 'Quit app' },
    { keys: ['Cmd', 'M'], action: 'Minimise window' }, { keys: ['Cmd', 'Shift', '3'], action: 'Screenshot' },
    { keys: ['Cmd', 'Shift', '4'], action: 'Screenshot selection' }, { keys: ['Ctrl', 'Cmd', 'F'], action: 'Fullscreen' },
    { keys: ['Option', 'Cmd', 'Esc'], action: 'Force quit' }, { keys: ['Cmd', ','], action: 'Preferences' },
  ]},
  { os: 'Windows', category: 'System', shortcuts: [
    { keys: ['Win', 'D'], action: 'Show desktop' }, { keys: ['Win', 'E'], action: 'File Explorer' },
    { keys: ['Win', 'L'], action: 'Lock screen' }, { keys: ['Win', 'R'], action: 'Run dialog' },
    { keys: ['Alt', 'Tab'], action: 'Switch windows' }, { keys: ['Win', 'Tab'], action: 'Task view' },
    { keys: ['Print Screen'], action: 'Screenshot' }, { keys: ['Win', 'Shift', 'S'], action: 'Snip screenshot' },
    { keys: ['Ctrl', 'Shift', 'Esc'], action: 'Task manager' }, { keys: ['Win', 'X'], action: 'Power user menu' },
  ]},
];

function KeyBadge({ k }: { k: string }) {
  return (
    <kbd className="inline-flex items-center px-2 py-0.5 rounded border border-border bg-card text-xs font-mono shadow-sm">
      {k}
    </kbd>
  );
}

export function KeyboardShortcutsTool() {
  const [activeOs, setActiveOs] = React.useState('Universal');
  const [search, setSearch] = React.useState('');

  const filtered = SHORTCUTS
    .filter(g => search ? true : g.os === activeOs)
    .map(g => ({ ...g, shortcuts: g.shortcuts.filter(s => !search || s.action.toLowerCase().includes(search.toLowerCase()) || s.keys.join(' ').toLowerCase().includes(search.toLowerCase())) }))
    .filter(g => g.shortcuts.length > 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <input className="flex-1 rounded-md border bg-card px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          placeholder="Search shortcuts…" value={search} onChange={e => setSearch(e.target.value)} />
        {!search && (
          <div className="flex flex-wrap gap-1.5">
            {SHORTCUTS.map(g => (
              <button key={g.os} onClick={() => setActiveOs(g.os)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${activeOs === g.os ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:border-foreground/30'}`}>
                {g.os}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.map(group => (
        <div key={group.os + group.category} className="space-y-2">
          {search && <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{group.os} — {group.category}</div>}
          <div className="rounded-lg border bg-card/50 divide-y divide-border">
            {group.shortcuts.map(s => (
              <div key={s.action} className="flex items-center justify-between px-3 py-2.5 gap-4">
                <span className="text-sm">{s.action}</span>
                <div className="flex items-center gap-1 shrink-0">
                  {s.keys.map((k, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <span className="text-muted-foreground text-xs">+</span>}
                      <KeyBadge k={k} />
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && <div className="text-center text-muted-foreground text-sm py-8">No shortcuts match your search.</div>}
    </div>
  );
}
