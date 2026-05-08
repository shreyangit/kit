// content-script/floating-button.ts
// RULE E5/E6: Must use Shadow DOM — never let extension styles bleed into the host page.
import type { PageStats } from '../types'

const KIT_HOST_ID = 'kit-tools-host'

interface MiniTool { id: string; icon: string; name: string }

const IMAGE_TOOLS: MiniTool[] = [
  { id: 'background-remover', icon: '✂️', name: 'Remove Background' },
  { id: 'image-compressor',   icon: '📦', name: 'Compress Image' },
  { id: 'exif-viewer',        icon: '📋', name: 'View EXIF' },
  { id: 'color-palette',      icon: '🎨', name: 'Extract Colours' },
]

const CODE_TOOLS: MiniTool[] = [
  { id: 'json-formatter',  icon: '{}', name: 'Format JSON' },
  { id: 'code-formatter',  icon: '✨', name: 'Format Code' },
  { id: 'regex-tester',    icon: '🔍', name: 'Test Regex' },
  { id: 'hash-generator',  icon: '#️⃣', name: 'Generate Hash' },
]

const TEXT_TOOLS: MiniTool[] = [
  { id: 'word-count',   icon: '📊', name: 'Word Count' },
  { id: 'text-case',    icon: '🔡', name: 'Convert Case' },
  { id: 'diff-checker', icon: '↔️', name: 'Diff Text' },
  { id: 'qr-code',      icon: '📱', name: 'Make QR Code' },
]

export function injectFloatingButton(stats: PageStats): void {
  // Never inject on kit itself
  if (window.location.hostname.includes('shreyannarula.com')) return
  if (document.getElementById(KIT_HOST_ID)) return

  const host = document.createElement('div')
  host.id = KIT_HOST_ID

  // RULE E6: All FAB HTML/CSS goes inside Shadow DOM
  const shadow = host.attachShadow({ mode: 'closed' })

  const tools = stats.largeImageCount > 0 ? IMAGE_TOOLS
    : stats.hasCode ? CODE_TOOLS
    : TEXT_TOOLS

  shadow.innerHTML = `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      .fab-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #6366f1;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(99,102,241,0.5);
        z-index: 2147483647;
        transition: transform 200ms ease, opacity 200ms ease, box-shadow 200ms ease;
        opacity: 0.85;
      }
      .fab-btn:hover { opacity: 1; box-shadow: 0 6px 24px rgba(99,102,241,0.7); }
      .fab-btn.open { transform: rotate(45deg); }
      .fab-menu {
        position: fixed;
        bottom: 76px;
        right: 24px;
        background: #1a1a1d;
        border: 1px solid #2e2e33;
        border-radius: 12px;
        padding: 6px;
        display: none;
        flex-direction: column;
        gap: 2px;
        z-index: 2147483646;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        min-width: 200px;
        animation: fadeIn 150ms ease;
      }
      .fab-menu.open { display: flex; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      .fab-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border: none;
        background: transparent;
        color: #f1f1f3;
        font-size: 13px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        cursor: pointer;
        border-radius: 8px;
        width: 100%;
        text-align: left;
        transition: background 120ms ease;
      }
      .fab-item:hover { background: #242428; }
      .fab-icon { font-size: 16px; width: 24px; text-align: center; flex-shrink: 0; }
      .fab-label { flex: 1; }
      .fab-logo {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px 8px;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.05em;
        color: #9898a6;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        border-bottom: 1px solid #2e2e33;
        margin-bottom: 4px;
      }
    </style>
    <div class="fab-menu" id="menu">
      <div class="fab-logo">🔧 kit tools</div>
      ${tools.map(t => `
        <button class="fab-item" data-tool-id="${t.id}">
          <span class="fab-icon">${t.icon}</span>
          <span class="fab-label">${t.name}</span>
        </button>
      `).join('')}
    </div>
    <button class="fab-btn" id="btn" aria-label="Open kit tools">
      <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
        <rect x="8" y="6" width="3.5" height="20" rx="1.5" fill="white"/>
        <polygon points="11.5,15 11.5,12.5 21,7 24,7 24,9.5 13,15.5" fill="white"/>
        <polygon points="11.5,17 11.5,19.5 21,25 24,25 24,22.5 13,16.5" fill="white"/>
        <rect x="21.5" y="9" width="2" height="14" rx="0.8" fill="#6366f1"/>
      </svg>
    </button>
  `

  document.body.appendChild(host)

  const btn = shadow.getElementById('btn')!
  const menu = shadow.getElementById('menu')!
  let open = false

  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    open = !open
    btn.classList.toggle('open', open)
    menu.classList.toggle('open', open)
  })

  // Tool item clicks
  shadow.querySelectorAll('.fab-item[data-tool-id]').forEach(el => {
    el.addEventListener('click', () => {
      const toolId = (el as HTMLElement).dataset.toolId!
      chrome.runtime.sendMessage({ type: 'OPEN_TOOL', toolId })
      open = false
      btn.classList.remove('open')
      menu.classList.remove('open')
    })
  })

  // Close on outside click
  document.addEventListener('click', () => {
    if (open) {
      open = false
      btn.classList.remove('open')
      menu.classList.remove('open')
    }
  })
}
