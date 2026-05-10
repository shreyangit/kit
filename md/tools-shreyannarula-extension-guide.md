# tools.shreyannarula.com — Chrome Extension Complete Implementation Guide
### Version 1.0 | Developer Account: Purchased | All 40+ Tools Covered

> This document is the complete, zero-ambiguity specification for building the Chrome Extension for tools.shreyannarula.com. An AI agent with no prior context should be able to implement the entire extension from this document alone without requiring clarification. All edge cases, unit tests, UX decisions, architecture choices, and future-proofing strategies are documented here.

---

## Table of Contents

1. [Philosophy & Design Principles](#1-philosophy--design-principles)
2. [Extension Architecture Overview](#2-extension-architecture-overview)
3. [File & Folder Structure](#3-file--folder-structure)
4. [Manifest v3 — Complete Specification](#4-manifest-v3--complete-specification)
5. [UX Design System — Solving the 100+ Tool Navigation Problem](#5-ux-design-system--solving-the-100-tool-navigation-problem)
6. [Popup — Complete Implementation](#6-popup--complete-implementation)
7. [Service Worker — Complete Implementation](#7-service-worker--complete-implementation)
8. [Content Script — Complete Implementation](#8-content-script--complete-implementation)
9. [In-Extension Tool Execution (Run Tools Without Opening a Tab)](#9-in-extension-tool-execution-run-tools-without-opening-a-tab)
10. [Context Menu System — All 40 Tools Mapped](#10-context-menu-system--all-40-tools-mapped)
11. [Data Flow & State Management](#11-data-flow--state-management)
12. [Build System & Tooling](#12-build-system--tooling)
13. [Unit Tests — Complete Test Suite](#13-unit-tests--complete-test-suite)
14. [Chrome Web Store Submission](#14-chrome-web-store-submission)
15. [Future-Proofing — Adding Tools Without Breaking Anything](#15-future-proofing--adding-tools-without-breaking-anything)
16. [Critical Rules & Edge Cases](#16-critical-rules--edge-cases)

---

## 1. Philosophy & Design Principles

### The Core Problem This Extension Solves

Without the extension, a user who wants to remove the background from an image on a webpage must:
1. Right-click the image → Save image to disk
2. Open a new tab → Navigate to `tools.shreyannarula.com`
3. Find the background remover tool
4. Upload the saved image
5. Wait for processing
6. Download the result

**With this extension, the same workflow is:**
1. Right-click the image → "Remove Background"
2. Done — result appears in a side panel

That is the bar. Every design decision must serve this goal: **make using our tools faster than any alternative, including navigating to the site itself.**

### Three Non-Negotiable UX Principles

**Principle 1 — Zero Clutter, Infinite Scale**
The extension must feel clean with 10 tools AND with 200 tools. The navigation system must handle arbitrary tool count without ever requiring the user to scroll through a long list or feel overwhelmed. This is solved with a category-based + search-first design.

**Principle 2 — Context Awareness**
The extension must know what the user is looking at and surface relevant tools automatically. On an image: show image tools. On a PDF link: show PDF tools. On selected text: show text tools. Tools that aren't relevant to the current context are hidden, not just grayed out.

**Principle 3 — Offline Capability for Pure-JS Tools**
Every tool that runs purely in JavaScript (no WASM, no network calls) must work fully offline within the extension. Users should never see a broken tool because they have a slow connection.

---

## 2. Extension Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CHROME BROWSER                                │
│                                                                       │
│  ┌──────────────┐    ┌─────────────────────────────────────────────┐ │
│  │   POPUP UI   │    │              ACTIVE WEB PAGE                 │ │
│  │              │    │  ┌────────────────────────────────────────┐  │ │
│  │  - Search    │    │  │         CONTENT SCRIPT                  │  │ │
│  │  - Categories│    │  │  - Detects page context                 │  │ │
│  │  - Recent    │◄───┤  │  - Injects floating action button       │  │ │
│  │  - Mini tool │    │  │  - Handles drag-to-extension            │  │ │
│  │    runners   │    │  │  - Captures selected text/images        │  │ │
│  │              │    │  └────────────────────────────────────────┘  │ │
│  └──────┬───────┘    └─────────────────────────────────────────────┘ │
│         │                              │                               │
│         ▼                              ▼                               │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                    SERVICE WORKER (background)                    │ │
│  │  - Manages context menus (right-click)                           │ │
│  │  - Routes messages between popup ↔ content script                │ │
│  │  - Manages chrome.storage (history, preferences, pinned tools)   │ │
│  │  - Handles file transfers between tabs                           │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                     SIDE PANEL (optional v2)                      │ │
│  │  - Full-featured tool UI embedded in browser                     │ │
│  │  - Works alongside current page without switching tabs           │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Communication Channels

| From | To | Method | Use Case |
|---|---|---|---|
| Popup | Service Worker | `chrome.runtime.sendMessage` | Open tool, save preference |
| Content Script | Service Worker | `chrome.runtime.sendMessage` | Report page context, request data |
| Service Worker | Content Script | `chrome.tabs.sendMessage` | Inject floating button |
| Service Worker | Popup | `chrome.runtime.sendMessage` | Update badge, notify |
| All | Storage | `chrome.storage.local` | Preferences, history, pinned tools |

---

## 3. File & Folder Structure

```
extension/
├── manifest.json                    # MV3 manifest — complete spec below
│
├── popup/
│   ├── popup.html                   # Shell HTML — loads popup.js
│   ├── popup.css                    # Styles — design system tokens
│   └── popup.js                     # Compiled from popup/src/
│
├── popup/src/                       # Source (compiled to popup.js)
│   ├── index.tsx                    # Root — renders <App />
│   ├── App.tsx                      # Main popup component
│   ├── components/
│   │   ├── SearchBar.tsx            # Fuzzy search input
│   │   ├── CategoryGrid.tsx         # Category tiles (top level nav)
│   │   ├── ToolGrid.tsx             # Tool cards within a category
│   │   ├── ToolCard.tsx             # Single tool card
│   │   ├── RecentTools.tsx          # Recently used strip
│   │   ├── PinnedTools.tsx          # User-pinned tools strip
│   │   ├── MiniToolRunner.tsx       # In-popup tool execution shell
│   │   ├── QuickTools.tsx           # Context-aware tool suggestions
│   │   ├── Header.tsx               # Logo + settings gear
│   │   └── EmptyState.tsx           # No results state
│   ├── mini-tools/                  # Self-contained in-popup tools
│   │   ├── MiniPasswordGenerator.tsx
│   │   ├── MiniBase64.tsx
│   │   ├── MiniHashGenerator.tsx
│   │   ├── MiniTextCase.tsx
│   │   ├── MiniWordCount.tsx
│   │   ├── MiniQRCode.tsx
│   │   ├── MiniUrlEncoder.tsx
│   │   ├── MiniJsonFormatter.tsx
│   │   ├── MiniRegexTester.tsx
│   │   ├── MiniLoremIpsum.tsx
│   │   ├── MiniColorConverter.tsx
│   │   ├── MiniUnitConverter.tsx
│   │   ├── MiniTimestamp.tsx
│   │   ├── MiniTimezone.tsx
│   │   ├── MiniDiff.tsx
│   │   └── MiniAspectRatio.tsx
│   ├── hooks/
│   │   ├── useStorage.ts            # chrome.storage.local wrapper
│   │   ├── usePageContext.ts        # Reads current tab's context
│   │   └── useSearch.ts             # Fuzzy search logic
│   ├── lib/
│   │   ├── tools-registry.ts        # Master list of all tools (synced with website)
│   │   ├── context-detector.ts      # Categorise page context from tab info
│   │   └── messaging.ts             # chrome.runtime.sendMessage wrappers
│   └── types.ts                     # Shared TypeScript types
│
├── service-worker/
│   └── service-worker.ts            # Background service worker
│
├── content-script/
│   ├── content-script.ts            # Main content script
│   ├── floating-button.ts           # Floating action button injector
│   └── context-detector.ts          # Detects what's on the page
│
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   ├── icon128.png
│   └── icon-dev.png                 # Red variant for dev mode
│
├── _locales/
│   └── en/
│       └── messages.json            # Internationalisation strings
│
├── build/                           # Compiled output (gitignored)
├── dist/                            # Final packaged extension (gitignored)
│
├── tests/
│   ├── unit/
│   │   ├── tools-registry.test.ts
│   │   ├── context-detector.test.ts
│   │   ├── mini-tools.test.ts
│   │   └── service-worker.test.ts
│   ├── integration/
│   │   ├── popup.test.tsx
│   │   └── content-script.test.ts
│   └── e2e/
│       └── extension.e2e.ts         # Playwright-based E2E
│
├── package.json
├── tsconfig.json
├── vite.config.ts                   # Build config
└── .env.development                 # EXTENSION_ENV=development
```

---

## 4. Manifest v3 — Complete Specification

```json
{
  "manifest_version": 3,
  "name": "Shreyan's Tools",
  "short_name": "Tools",
  "version": "1.0.0",
  "description": "110+ browser-based utility tools. Remove backgrounds, convert files, format code — right from your browser. No uploads. No accounts. 100% private.",

  "icons": {
    "16":  "icons/icon16.png",
    "32":  "icons/icon32.png",
    "48":  "icons/icon48.png",
    "128": "icons/icon128.png"
  },

  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16":  "icons/icon16.png",
      "32":  "icons/icon32.png",
      "48":  "icons/icon48.png",
      "128": "icons/icon128.png"
    },
    "default_title": "Shreyan's Tools — Click to open"
  },

  "background": {
    "service_worker": "service-worker/service-worker.js",
    "type": "module"
  },

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content-script/content-script.js"],
      "run_at": "document_idle",
      "all_frames": false
    }
  ],

  "side_panel": {
    "default_path": "popup/popup.html"
  },

  "permissions": [
    "contextMenus",
    "activeTab",
    "storage",
    "scripting",
    "notifications",
    "sidePanel",
    "clipboardRead",
    "clipboardWrite",
    "offscreen"
  ],

  "host_permissions": [
    "<all_urls>"
  ],

  "web_accessible_resources": [
    {
      "resources": [
        "popup/popup.html",
        "icons/*"
      ],
      "matches": ["<all_urls>"]
    }
  ],

  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
  },

  "commands": {
    "_execute_action": {
      "suggested_key": {
        "default": "Alt+Shift+T",
        "mac": "Alt+Shift+T"
      },
      "description": "Open Shreyan's Tools"
    },
    "open-search": {
      "suggested_key": {
        "default": "Alt+Shift+S"
      },
      "description": "Open tools search"
    }
  },

  "minimum_chrome_version": "116",

  "_comment_about_permissions": {
    "contextMenus": "Right-click menu integration",
    "activeTab": "Read current tab URL and title for context detection",
    "storage": "Save user preferences, history, pinned tools",
    "scripting": "Inject content scripts programmatically when needed",
    "notifications": "Notify user when long processing (background removal) completes",
    "sidePanel": "Chrome 116+ side panel API for persistent tool access",
    "clipboardRead": "Paste from clipboard directly into tools",
    "clipboardWrite": "Copy tool outputs to clipboard",
    "offscreen": "Run WASM tools (background removal, etc.) in offscreen document"
  }
}
```

**Important notes on permissions:**
- `"wasm-unsafe-eval"` in CSP is required for WebAssembly execution inside the extension. Without it, FFmpeg and Tesseract WASM will throw a CSP violation.
- `offscreen` permission enables creating an offscreen document — a hidden page that can run WASM without blocking the UI. This is how heavy tools (background removal, OCR) work inside the extension.
- `sidePanel` requires Chrome 116+. This is why `minimum_chrome_version` is set to 116.

---

## 5. UX Design System — Solving the 100+ Tool Navigation Problem

### The Navigation Hierarchy

The popup uses a **three-level navigation** that never shows more than 12 items at once:

```
Level 0: HOME
├── Search bar (always visible)
├── Quick Tools strip (context-aware, 3–5 tools)
├── Recently Used (last 5)
├── Pinned Tools (user-defined, 0–8)
└── Category Grid (10 categories, 2×5 grid)

Level 1: CATEGORY VIEW (e.g., "Image Tools")
├── Back button
├── Category title + icon
├── Tool grid (up to 12 tools, scrollable if more)
└── Each tool card: icon, name, one-line description

Level 2: MINI TOOL RUNNER (for in-popup tools)
├── Back button
├── Tool name + "Open in full tab →" link
└── Minimal tool UI (input → process → copy/download)
```

### Category Definitions (Maps to tools-registry.ts)

```typescript
export const CATEGORIES = [
  { id: 'image',      label: 'Image',      icon: '🖼️',  color: '#3B82F6', toolCount: 14 },
  { id: 'document',   label: 'Documents',  icon: '📄',  color: '#8B5CF6', toolCount: 12 },
  { id: 'text-code',  label: 'Text & Code',icon: '💻',  color: '#10B981', toolCount: 18 },
  { id: 'audio-video',label: 'Audio/Video',icon: '🎵',  color: '#F59E0B', toolCount: 6  },
  { id: 'design',     label: 'Design',     icon: '🎨',  color: '#EC4899', toolCount: 10 },
  { id: 'data',       label: 'Data',       icon: '📊',  color: '#06B6D4', toolCount: 8  },
  { id: 'web-seo',    label: 'Web & SEO',  icon: '🌐',  color: '#84CC16', toolCount: 10 },
  { id: 'security',   label: 'Security',   icon: '🔒',  color: '#EF4444', toolCount: 8  },
  { id: 'converters', label: 'Converters', icon: '🔄',  color: '#F97316', toolCount: 10 },
  { id: 'utilities',  label: 'Utilities',  icon: '🛠️',  color: '#6366F1', toolCount: 14 },
] as const
```

### Popup Dimensions

```
Width:  380px  (fixed — Chrome popup max is 800px, 380 feels native)
Height: 560px  (fixed — scrollable content within, never expand popup)
```

**Why fixed dimensions:** Popups that resize feel unstable and janky. A fixed 380×560px canvas forces good design decisions. All content must fit within this space or scroll within defined zones.

### Design Tokens (popup.css)

```css
:root {
  /* Colours */
  --bg-primary:    #0f0f10;   /* Near-black background */
  --bg-secondary:  #1a1a1d;   /* Card/elevated surfaces */
  --bg-tertiary:   #242428;   /* Input backgrounds */
  --border:        #2e2e33;   /* Subtle borders */
  --text-primary:  #f1f1f3;   /* Primary text */
  --text-secondary:#9898a6;   /* Secondary/muted text */
  --text-disabled: #4a4a55;   /* Disabled state */
  --accent:        #6366f1;   /* Primary accent — indigo */
  --accent-hover:  #818cf8;
  --success:       #22c55e;
  --warning:       #f59e0b;
  --error:         #ef4444;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;

  /* Typography */
  --font-size-xs:   11px;
  --font-size-sm:   12px;
  --font-size-base: 13px;
  --font-size-md:   14px;
  --font-size-lg:   16px;

  /* Border radius */
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  14px;
  --radius-full: 9999px;

  /* Transitions */
  --transition-fast: 120ms ease;
  --transition-base: 200ms ease;

  /* Shadows */
  --shadow-card: 0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3);
}

/* Base reset */
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  width: 380px;
  height: 560px;
  overflow: hidden;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: var(--font-size-base);
  line-height: 1.5;
}
```

### Search Behaviour

The search bar is the most critical UX element. Rules:
- Autofocused when popup opens
- Searches across: tool name, description, tags, category
- Uses fuzzy matching: "bg remov" finds "Background Remover"
- Results show instantly (no debounce — all data is local)
- Keyboard navigation: `↑↓` to move between results, `Enter` to open
- `Escape` clears search and returns to home
- Show max 8 results — no pagination, user should refine query

```typescript
// hooks/useSearch.ts
export function useSearch(query: string): Tool[] {
  return useMemo(() => {
    if (!query.trim()) return []

    const q = query.toLowerCase()
    const scored = tools.map(tool => {
      let score = 0

      // Exact name match: highest score
      if (tool.name.toLowerCase() === q) score += 100
      // Name starts with query
      else if (tool.name.toLowerCase().startsWith(q)) score += 80
      // Name contains query
      else if (tool.name.toLowerCase().includes(q)) score += 60
      // Description contains query
      else if (tool.description.toLowerCase().includes(q)) score += 40
      // Tags contain query
      else if (tool.tags.some(tag => tag.includes(q))) score += 50
      // Fuzzy: all query chars appear in name in order
      else if (fuzzyMatch(q, tool.name.toLowerCase())) score += 20

      return { tool, score }
    })

    return scored
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(({ tool }) => tool)
  }, [query])
}

function fuzzyMatch(query: string, target: string): boolean {
  let qi = 0
  for (let i = 0; i < target.length && qi < query.length; i++) {
    if (target[i] === query[qi]) qi++
  }
  return qi === query.length
}
```

---

## 6. Popup — Complete Implementation

### popup.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=380px">
  <title>Shreyan's Tools</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="popup.js"></script>
</body>
</html>
```

### App.tsx — Navigation State Machine

```tsx
// popup/src/App.tsx
import { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { SearchBar } from './components/SearchBar'
import { HomeView } from './components/HomeView'
import { CategoryView } from './components/CategoryView'
import { MiniToolRunner } from './components/MiniToolRunner'
import { usePageContext } from './hooks/usePageContext'
import { useStorage } from './hooks/useStorage'

type View =
  | { type: 'home' }
  | { type: 'search'; query: string }
  | { type: 'category'; categoryId: string }
  | { type: 'mini-tool'; toolId: string; prefillData?: PrefillData }

export interface PrefillData {
  text?: string
  imageUrl?: string
  url?: string
  fileDataUrl?: string   // base64 data URL for small files passed via context menu
}

export function App() {
  const [view, setView] = useState<View>({ type: 'home' })
  const [searchQuery, setSearchQuery] = useState('')
  const pageContext = usePageContext()
  const [recentTools] = useStorage<string[]>('recentTools', [])
  const [pinnedTools] = useStorage<string[]>('pinnedTools', [])

  // Handle prefill data passed from context menu via chrome.storage.session
  useEffect(() => {
    chrome.storage.session.get(['pendingPrefill'], ({ pendingPrefill }) => {
      if (pendingPrefill) {
        const { toolId, data } = pendingPrefill
        setView({ type: 'mini-tool', toolId, prefillData: data })
        chrome.storage.session.remove(['pendingPrefill'])
      }
    })
  }, [])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setView(query ? { type: 'search', query } : { type: 'home' })
  }

  const handleToolClick = (toolId: string, prefillData?: PrefillData) => {
    const tool = getTool(toolId)
    if (!tool) return

    if (tool.hasInlineRunner) {
      // Show mini tool inside popup
      setView({ type: 'mini-tool', toolId, prefillData })
    } else {
      // Open full tool in new tab
      openToolInTab(toolId, prefillData)
    }
  }

  return (
    <div className="app">
      <Header onSettingsClick={() => openToolInTab('settings')} />

      <SearchBar
        value={searchQuery}
        onChange={handleSearch}
        autoFocus={view.type === 'home'}
      />

      <div className="view-container">
        {view.type === 'home' && (
          <HomeView
            pageContext={pageContext}
            recentTools={recentTools}
            pinnedTools={pinnedTools}
            onToolClick={handleToolClick}
            onCategoryClick={(id) => setView({ type: 'category', categoryId: id })}
          />
        )}

        {view.type === 'search' && (
          <SearchResultsView
            query={searchQuery}
            onToolClick={handleToolClick}
          />
        )}

        {view.type === 'category' && (
          <CategoryView
            categoryId={view.categoryId}
            onBack={() => setView({ type: 'home' })}
            onToolClick={handleToolClick}
          />
        )}

        {view.type === 'mini-tool' && (
          <MiniToolRunner
            toolId={view.toolId}
            prefillData={view.prefillData}
            onBack={() => setView({ type: 'home' })}
            onOpenFullTab={() => openToolInTab(view.toolId, view.prefillData)}
          />
        )}
      </div>
    </div>
  )
}

function openToolInTab(toolId: string, prefillData?: PrefillData) {
  const baseUrl = 'https://tools.shreyannarula.com/tools/'
  const params = new URLSearchParams()

  if (prefillData?.text) params.set('text', prefillData.text)
  if (prefillData?.imageUrl) params.set('imageUrl', prefillData.imageUrl)
  if (prefillData?.url) params.set('url', prefillData.url)

  const url = `${baseUrl}${toolId}${params.toString() ? '?' + params.toString() : ''}`
  chrome.tabs.create({ url })
  window.close()
}
```

### HomeView.tsx

```tsx
// popup/src/components/HomeView.tsx
export function HomeView({ pageContext, recentTools, pinnedTools, onToolClick, onCategoryClick }) {

  const quickTools = getContextualTools(pageContext)  // 3–5 tools based on page

  return (
    <div className="home-view">

      {/* Quick Tools — context-aware */}
      {quickTools.length > 0 && (
        <section className="section">
          <h3 className="section-title">
            {getContextLabel(pageContext)}
          </h3>
          <div className="quick-tools-strip">
            {quickTools.map(tool => (
              <QuickToolChip
                key={tool.id}
                tool={tool}
                onClick={() => onToolClick(tool.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Pinned Tools */}
      {pinnedTools.length > 0 && (
        <section className="section">
          <h3 className="section-title">Pinned</h3>
          <div className="pinned-tools-grid">
            {pinnedTools.map(id => {
              const tool = getTool(id)
              return tool ? (
                <ToolCard key={id} tool={tool} compact onClick={() => onToolClick(id)} />
              ) : null
            })}
          </div>
        </section>
      )}

      {/* Recently Used */}
      {recentTools.length > 0 && (
        <section className="section">
          <h3 className="section-title">Recent</h3>
          <div className="recent-tools-strip">
            {recentTools.slice(0, 5).map(id => {
              const tool = getTool(id)
              return tool ? (
                <RecentChip key={id} tool={tool} onClick={() => onToolClick(id)} />
              ) : null
            })}
          </div>
        </section>
      )}

      {/* Category Grid */}
      <section className="section">
        <h3 className="section-title">All Tools</h3>
        <div className="category-grid">
          {CATEGORIES.map(cat => (
            <CategoryTile
              key={cat.id}
              category={cat}
              onClick={() => onCategoryClick(cat.id)}
            />
          ))}
        </div>
      </section>

    </div>
  )
}
```

### Context Detection for Quick Tools

```typescript
// lib/context-detector.ts

export type PageContext =
  | 'image-page'        // page has a large image as primary content
  | 'pdf'               // page is a PDF (chrome-extension://... or .pdf URL)
  | 'has-images'        // page has images but isn't primarily an image
  | 'text-heavy'        // Wikipedia, articles, news pages
  | 'code-page'         // GitHub, Stack Overflow, CodePen
  | 'video-page'        // YouTube, Vimeo
  | 'form-page'         // page has prominent forms
  | 'generic'           // everything else

export interface TabInfo {
  url: string
  title: string
  favIconUrl?: string
}

export function detectPageContext(tabInfo: TabInfo, pageStats?: PageStats): PageContext {
  const { url, title } = tabInfo

  // PDF detection
  if (url.endsWith('.pdf') || url.includes('viewer.html?file=') || title.endsWith('.pdf')) {
    return 'pdf'
  }

  // Video pages
  if (url.includes('youtube.com/watch') || url.includes('vimeo.com/') || url.includes('dailymotion.com/')) {
    return 'video-page'
  }

  // Code pages
  if (url.includes('github.com') || url.includes('stackoverflow.com') ||
      url.includes('codepen.io') || url.includes('jsfiddle.net') ||
      url.includes('codesandbox.io')) {
    return 'code-page'
  }

  // Text-heavy pages
  if (url.includes('wikipedia.org') || url.includes('medium.com') ||
      url.includes('dev.to') || url.includes('news.ycombinator.com')) {
    return 'text-heavy'
  }

  // Use page stats from content script if available
  if (pageStats) {
    if (pageStats.largeImageCount > 0 && pageStats.totalImages <= 3) return 'image-page'
    if (pageStats.totalImages > 5) return 'has-images'
    if (pageStats.wordCount > 800) return 'text-heavy'
  }

  return 'generic'
}

export function getContextualTools(context: PageContext): Tool[] {
  const toolMap: Record<PageContext, string[]> = {
    'image-page':   ['background-remover', 'image-compressor', 'image-converter', 'exif-viewer', 'color-palette'],
    'pdf':          ['pdf-merger', 'pdf-to-image', 'pdf-compressor', 'image-to-pdf'],
    'has-images':   ['background-remover', 'image-compressor', 'watermark', 'image-converter'],
    'text-heavy':   ['word-count', 'text-case', 'lorem-ipsum', 'text-to-speech', 'markdown-to-html'],
    'code-page':    ['code-formatter', 'json-formatter', 'regex-tester', 'hash-generator', 'base64'],
    'video-page':   ['video-to-gif', 'audio-trimmer'],
    'form-page':    ['password-generator', 'fake-data-generator', 'lorem-ipsum'],
    'generic':      ['password-generator', 'qr-code', 'color-converter', 'unit-converter'],
  }

  return (toolMap[context] ?? toolMap.generic)
    .map(id => getTool(id))
    .filter(Boolean) as Tool[]
}

export function getContextLabel(context: PageContext): string {
  const labels: Record<PageContext, string> = {
    'image-page':   '🖼️ Image tools for this page',
    'pdf':          '📄 PDF tools',
    'has-images':   '🖼️ Image tools',
    'text-heavy':   '📝 Text tools for this content',
    'code-page':    '💻 Developer tools',
    'video-page':   '🎥 Video tools',
    'form-page':    '📋 Form helper tools',
    'generic':      '⚡ Quick tools',
  }
  return labels[context]
}

export interface PageStats {
  totalImages: number
  largeImageCount: number    // images > 300×300 px
  wordCount: number
  hasForms: boolean
  hasVideo: boolean
  hasCode: boolean           // <code> or <pre> elements
}
```

---

## 7. Service Worker — Complete Implementation

```typescript
// service-worker/service-worker.ts

import { CONTEXT_MENUS, buildContextMenus } from './context-menus'
import { handleMessage } from './message-handler'

// ── Lifecycle ──────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async (details) => {
  // Build all context menus
  await chrome.contextMenus.removeAll()
  buildContextMenus()

  // Set default storage values on first install
  if (details.reason === 'install') {
    await chrome.storage.local.set({
      recentTools: [],
      pinnedTools: [],
      preferences: {
        theme: 'dark',
        openInSidePanel: false,
        showQuickTools: true,
        notifyOnComplete: true,
      },
      installDate: Date.now(),
      toolUsageCount: {},
    })

    // Open onboarding page
    chrome.tabs.create({ url: 'https://tools.shreyannarula.com/welcome?source=extension' })
  }

  // Re-register context menus on update (they get cleared)
  if (details.reason === 'update') {
    buildContextMenus()
  }
})

// Service workers can be killed and restarted — re-register menus on startup
chrome.runtime.onStartup.addListener(() => {
  buildContextMenus()
})

// ── Context Menu Click Handler ─────────────────────────────────────────────

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return

  const toolId = CONTEXT_MENU_TOOL_MAP[info.menuItemId as string]
  if (!toolId) return

  // Build prefill data from context menu info
  const prefillData: PrefillData = {}
  if (info.srcUrl) prefillData.imageUrl = info.srcUrl
  if (info.selectionText) prefillData.text = info.selectionText
  if (info.linkUrl) prefillData.url = info.linkUrl
  if (info.frameUrl) prefillData.url = info.frameUrl
  if (info.pageUrl) prefillData.pageUrl = info.pageUrl

  const tool = getTool(toolId)
  if (!tool) return

  // Store prefill data for popup to pick up
  await chrome.storage.session.set({ pendingPrefill: { toolId, data: prefillData } })

  if (tool.hasInlineRunner) {
    // Open popup to show mini tool runner
    await chrome.action.openPopup()
  } else {
    // Open tool in new tab (or side panel based on preference)
    const prefs = await getPreferences()
    if (prefs.openInSidePanel) {
      await chrome.sidePanel.open({ tabId: tab.id })
    } else {
      const params = buildURLParams(prefillData)
      chrome.tabs.create({
        url: `https://tools.shreyannarula.com/tools/${toolId}${params}`
      })
    }
  }

  // Track usage
  await trackToolUsage(toolId)
})

// ── Message Handler ────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse)
  return true  // CRITICAL: return true to keep message channel open for async responses
})

// ── Badge Management ───────────────────────────────────────────────────────

// Show a badge count when there are unread results (e.g., background removal completed)
export async function setBadge(text: string, color: string = '#6366f1') {
  await chrome.action.setBadgeText({ text })
  await chrome.action.setBadgeBackgroundColor({ color })
}

export async function clearBadge() {
  await chrome.action.setBadgeText({ text: '' })
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function getPreferences(): Promise<ExtensionPreferences> {
  const { preferences } = await chrome.storage.local.get('preferences')
  return preferences ?? {}
}

async function trackToolUsage(toolId: string) {
  const { recentTools = [], toolUsageCount = {} } = await chrome.storage.local.get([
    'recentTools', 'toolUsageCount'
  ])

  const updatedRecent = [toolId, ...recentTools.filter((id: string) => id !== toolId)].slice(0, 10)
  const updatedCount = { ...toolUsageCount, [toolId]: (toolUsageCount[toolId] ?? 0) + 1 }

  await chrome.storage.local.set({ recentTools: updatedRecent, toolUsageCount: updatedCount })
}

function buildURLParams(prefillData: PrefillData): string {
  const params = new URLSearchParams()
  if (prefillData.text) params.set('text', prefillData.text.slice(0, 5000))  // limit text length
  if (prefillData.imageUrl) params.set('imageUrl', prefillData.imageUrl)
  if (prefillData.url) params.set('url', prefillData.url)
  const str = params.toString()
  return str ? '?' + str : ''
}
```

---

## 8. Content Script — Complete Implementation

```typescript
// content-script/content-script.ts

import { detectPageStats } from './context-detector'
import { injectFloatingButton } from './floating-button'

// Run once when page is idle
let initialised = false

async function init() {
  if (initialised) return
  initialised = true

  // Collect page stats and send to service worker
  const stats = detectPageStats()
  chrome.runtime.sendMessage({
    type: 'PAGE_STATS',
    payload: {
      url: window.location.href,
      title: document.title,
      stats,
    }
  })

  // Inject floating action button on pages with images
  if (stats.largeImageCount > 0 || stats.hasVideo) {
    await injectFloatingButton(stats)
  }

  // Listen for messages from service worker
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'GET_PAGE_STATS') {
      sendResponse(detectPageStats())
    }
    if (message.type === 'GET_SELECTED_IMAGE') {
      sendResponse(getHoveredImage())
    }
    return true
  })
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

// ── Page Stats Detection ────────────────────────────────────────────────────

// content-script/context-detector.ts
export function detectPageStats(): PageStats {
  const images = Array.from(document.querySelectorAll('img'))
  const largeImages = images.filter(img =>
    img.naturalWidth > 300 && img.naturalHeight > 300
  )
  const text = document.body?.innerText ?? ''
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length

  return {
    totalImages: images.length,
    largeImageCount: largeImages.length,
    wordCount,
    hasForms: document.querySelectorAll('form, input[type="text"]').length > 0,
    hasVideo: document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length > 0,
    hasCode: document.querySelectorAll('pre, code').length > 3,
  }
}

// ── Floating Action Button ──────────────────────────────────────────────────

// content-script/floating-button.ts
export async function injectFloatingButton(stats: PageStats) {
  // Don't inject on our own site
  if (window.location.hostname.includes('shreyannarula.com')) return

  // Don't inject if already injected
  if (document.getElementById('shreyan-tools-fab')) return

  const fab = document.createElement('div')
  fab.id = 'shreyan-tools-fab'
  fab.innerHTML = `
    <button
      id="shreyan-tools-fab-btn"
      title="Open Shreyan's Tools"
      style="
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
        box-shadow: 0 4px 12px rgba(99,102,241,0.5);
        z-index: 2147483647;
        transition: transform 120ms ease, opacity 120ms ease;
        opacity: 0.85;
      "
      aria-label="Open Shreyan's Tools"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    </button>
    <div
      id="shreyan-tools-fab-menu"
      style="
        position: fixed;
        bottom: 76px;
        right: 24px;
        background: #1a1a1d;
        border: 1px solid #2e2e33;
        border-radius: 12px;
        padding: 8px;
        display: none;
        flex-direction: column;
        gap: 4px;
        z-index: 2147483646;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        min-width: 200px;
      "
    ></div>
  `

  document.body.appendChild(fab)

  const btn = document.getElementById('shreyan-tools-fab-btn')!
  const menu = document.getElementById('shreyan-tools-fab-menu')!

  // Populate menu with contextual tools
  const contextTools = stats.largeImageCount > 0
    ? ['background-remover', 'image-compressor', 'exif-viewer', 'color-palette']
    : ['word-count', 'text-case', 'qr-code', 'url-encoder']

  contextTools.forEach(toolId => {
    const tool = getToolById(toolId)  // uses embedded mini registry
    if (!tool) return

    const item = document.createElement('button')
    item.style.cssText = `
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px; border: none; background: transparent;
      color: #f1f1f3; font-size: 13px; cursor: pointer;
      border-radius: 8px; width: 100%; text-align: left;
      transition: background 120ms ease;
    `
    item.innerHTML = `<span>${tool.icon}</span><span>${tool.name}</span>`
    item.addEventListener('mouseover', () => item.style.background = '#242428')
    item.addEventListener('mouseout', () => item.style.background = 'transparent')
    item.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'OPEN_TOOL', toolId })
      menu.style.display = 'none'
    })
    menu.appendChild(item)
  })

  // Toggle menu on FAB click
  let menuOpen = false
  btn.addEventListener('click', () => {
    menuOpen = !menuOpen
    menu.style.display = menuOpen ? 'flex' : 'none'
    btn.style.transform = menuOpen ? 'rotate(45deg)' : 'rotate(0)'
  })

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!fab.contains(e.target as Node)) {
      menuOpen = false
      menu.style.display = 'none'
      btn.style.transform = 'rotate(0)'
    }
  })

  btn.addEventListener('mouseover', () => btn.style.opacity = '1')
  btn.addEventListener('mouseout', () => btn.style.opacity = menuOpen ? '1' : '0.85')
}
```

---

## 9. In-Extension Tool Execution (Run Tools Without Opening a Tab)

### Which Tools Run Inline vs. Open Full Tab

**Inline (in popup):** Pure-JS tools with simple input/output
**Full tab required:** WASM tools (background removal, FFmpeg), multi-file tools, tools needing large UI

```typescript
// lib/tools-registry.ts — add hasInlineRunner flag
export const tools: Tool[] = [
  // ---- INLINE RUNNERS (run in popup) ----
  { id: 'password-generator', hasInlineRunner: true, ... },
  { id: 'base64',             hasInlineRunner: true, ... },
  { id: 'hash-generator',     hasInlineRunner: true, ... },
  { id: 'text-case',          hasInlineRunner: true, ... },
  { id: 'word-count',         hasInlineRunner: true, ... },
  { id: 'qr-code',            hasInlineRunner: true, ... },
  { id: 'url-encoder',        hasInlineRunner: true, ... },
  { id: 'json-formatter',     hasInlineRunner: true, ... },
  { id: 'regex-tester',       hasInlineRunner: true, ... },
  { id: 'lorem-ipsum',        hasInlineRunner: true, ... },
  { id: 'color-converter',    hasInlineRunner: true, ... },
  { id: 'unit-converter',     hasInlineRunner: true, ... },
  { id: 'unix-timestamp',     hasInlineRunner: true, ... },
  { id: 'timezone-converter', hasInlineRunner: true, ... },
  { id: 'diff-checker',       hasInlineRunner: true, ... },
  { id: 'aspect-ratio',       hasInlineRunner: true, ... },
  { id: 'char-counter',       hasInlineRunner: true, ... },
  { id: 'number-base',        hasInlineRunner: true, ... },
  { id: 'html-entities',      hasInlineRunner: true, ... },
  { id: 'jwt-decoder',        hasInlineRunner: true, ... },

  // ---- FULL TAB REQUIRED ----
  { id: 'background-remover', hasInlineRunner: false, ... },
  { id: 'image-compressor',   hasInlineRunner: false, ... },
  { id: 'pdf-merger',         hasInlineRunner: false, ... },
  // ... all WASM and file-heavy tools
]
```

### MiniToolRunner Component Pattern

Every inline tool follows this exact pattern:

```tsx
// components/MiniToolRunner.tsx
export function MiniToolRunner({ toolId, prefillData, onBack, onOpenFullTab }) {
  const MiniTool = MINI_TOOL_MAP[toolId]

  if (!MiniTool) {
    // Shouldn't happen — fallback to opening in tab
    onOpenFullTab()
    return null
  }

  return (
    <div className="mini-tool-runner">
      <div className="mini-tool-header">
        <button onClick={onBack} className="back-btn" aria-label="Back">
          ← Back
        </button>
        <span className="mini-tool-title">{getTool(toolId)?.name}</span>
        <button onClick={onOpenFullTab} className="open-full-btn" title="Open in full tab">
          ↗
        </button>
      </div>
      <div className="mini-tool-body">
        <MiniTool prefillData={prefillData} />
      </div>
    </div>
  )
}

const MINI_TOOL_MAP: Record<string, React.ComponentType<{ prefillData?: PrefillData }>> = {
  'password-generator': MiniPasswordGenerator,
  'base64':             MiniBase64,
  'hash-generator':     MiniHashGenerator,
  'text-case':          MiniTextCase,
  'word-count':         MiniWordCount,
  'qr-code':            MiniQRCode,
  'url-encoder':        MiniUrlEncoder,
  'json-formatter':     MiniJsonFormatter,
  'regex-tester':       MiniRegexTester,
  'lorem-ipsum':        MiniLoremIpsum,
  'color-converter':    MiniColorConverter,
  'unit-converter':     MiniUnitConverter,
  'unix-timestamp':     MiniTimestamp,
  'timezone-converter': MiniTimezone,
  'diff-checker':       MiniDiff,
  'aspect-ratio':       MiniAspectRatio,
  'char-counter':       MiniCharCounter,
  'number-base':        MiniNumberBase,
  'html-entities':      MiniHTMLEntities,
  'jwt-decoder':        MiniJWTDecoder,
}
```

### Example Mini Tool: MiniPasswordGenerator.tsx

```tsx
// popup/src/mini-tools/MiniPasswordGenerator.tsx
import { useState, useCallback } from 'react'

export function MiniPasswordGenerator({ prefillData }: { prefillData?: PrefillData }) {
  const [length, setLength] = useState(16)
  const [options, setOptions] = useState({
    uppercase: true, lowercase: true, numbers: true, symbols: true
  })
  const [passwords, setPasswords] = useState<string[]>([])
  const [copied, setCopied] = useState<number | null>(null)

  const generate = useCallback(() => {
    const newPasswords = Array.from({ length: 5 }, () => generatePassword({ length, ...options }))
    setPasswords(newPasswords)
  }, [length, options])

  // Auto-generate on mount
  useState(() => { generate() })

  const copy = async (password: string, index: number) => {
    await navigator.clipboard.writeText(password)
    setCopied(index)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="mini-tool">
      {/* Controls */}
      <div className="mini-controls">
        <div className="control-row">
          <label className="control-label">Length: {length}</label>
          <input
            type="range" min={8} max={64} value={length}
            onChange={e => setLength(Number(e.target.value))}
            className="slider"
          />
        </div>
        <div className="checkbox-row">
          {(['uppercase', 'lowercase', 'numbers', 'symbols'] as const).map(opt => (
            <label key={opt} className="checkbox-label">
              <input
                type="checkbox"
                checked={options[opt]}
                onChange={e => setOptions(prev => ({ ...prev, [opt]: e.target.checked }))}
              />
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </label>
          ))}
        </div>
      </div>

      {/* Password List */}
      <div className="password-list">
        {passwords.map((pw, i) => (
          <div key={i} className="password-item">
            <span className="password-text">{pw}</span>
            <button
              className={`copy-btn ${copied === i ? 'copied' : ''}`}
              onClick={() => copy(pw, i)}
            >
              {copied === i ? '✓' : 'Copy'}
            </button>
          </div>
        ))}
      </div>

      {/* Regenerate */}
      <button className="btn-primary full-width" onClick={generate}>
        Regenerate
      </button>
    </div>
  )
}
```

---

## 10. Context Menu System — All 40 Tools Mapped

```typescript
// service-worker/context-menus.ts

// Full map: contextMenuId → toolId
export const CONTEXT_MENU_TOOL_MAP: Record<string, string> = {
  // Image contexts
  'img-remove-bg':       'background-remover',
  'img-compress':        'image-compressor',
  'img-convert':         'image-converter',
  'img-resize':          'image-resizer',
  'img-exif-view':       'exif-viewer',
  'img-palette':         'color-palette',
  'img-watermark':       'watermark',
  'img-gps-map':         'gps-map',
  'img-to-pdf':          'image-to-pdf',
  'img-ocr':             'image-to-text',
  'img-qr':              'qr-code',

  // Text/selection contexts
  'text-word-count':     'word-count',
  'text-case':           'text-case',
  'text-hash':           'hash-generator',
  'text-base64-enc':     'base64',
  'text-base64-dec':     'base64',
  'text-html-enc':       'html-entities',
  'text-jwt-decode':     'jwt-decoder',
  'text-regex':          'regex-tester',
  'text-lorem':          'lorem-ipsum',
  'text-diff':           'diff-checker',
  'text-speech':         'text-to-speech',
  'text-timestamp':      'unix-timestamp',
  'text-format-code':    'code-formatter',
  'text-barcode':        'barcode-generator',

  // Link/URL contexts
  'link-qr':             'qr-code',
  'link-og-preview':     'og-preview',
  'link-url-encode':     'url-encoder',
  'link-favicon':        'favicon-generator',

  // Page contexts
  'page-qr':             'qr-code',
  'page-og-preview':     'og-preview',
  'page-meta-tags':      'meta-tag-generator',
  'page-sitemap':        'sitemap-generator',

  // Video contexts
  'video-to-gif':        'video-to-gif',
}

export function buildContextMenus() {
  // ── Image Right-Click ──────────────────────────────────────────────────
  chrome.contextMenus.create({ id: 'shreyan-img', title: "🛠️ Shreyan's Tools", contexts: ['image'] })

  chrome.contextMenus.create({ id: 'img-remove-bg', parentId: 'shreyan-img', title: '✂️ Remove Background', contexts: ['image'] })
  chrome.contextMenus.create({ id: 'img-compress',  parentId: 'shreyan-img', title: '📦 Compress Image', contexts: ['image'] })
  chrome.contextMenus.create({ id: 'img-convert',   parentId: 'shreyan-img', title: '🔄 Convert Format', contexts: ['image'] })
  chrome.contextMenus.create({ id: 'img-resize',    parentId: 'shreyan-img', title: '📐 Resize & Crop', contexts: ['image'] })
  chrome.contextMenus.create({ id: 'sep-img-1', parentId: 'shreyan-img', type: 'separator', contexts: ['image'] })
  chrome.contextMenus.create({ id: 'img-exif-view', parentId: 'shreyan-img', title: '📋 View EXIF Data', contexts: ['image'] })
  chrome.contextMenus.create({ id: 'img-palette',   parentId: 'shreyan-img', title: '🎨 Extract Colour Palette', contexts: ['image'] })
  chrome.contextMenus.create({ id: 'img-watermark', parentId: 'shreyan-img', title: '💧 Add Watermark', contexts: ['image'] })
  chrome.contextMenus.create({ id: 'img-ocr',       parentId: 'shreyan-img', title: '📝 Extract Text (OCR)', contexts: ['image'] })
  chrome.contextMenus.create({ id: 'sep-img-2', parentId: 'shreyan-img', type: 'separator', contexts: ['image'] })
  chrome.contextMenus.create({ id: 'img-to-pdf',    parentId: 'shreyan-img', title: '📄 Convert to PDF', contexts: ['image'] })
  chrome.contextMenus.create({ id: 'img-qr',        parentId: 'shreyan-img', title: '📱 Make QR Code of URL', contexts: ['image'] })
  chrome.contextMenus.create({ id: 'img-gps-map',   parentId: 'shreyan-img', title: '📍 Show GPS Location', contexts: ['image'] })

  // ── Text Selection Right-Click ─────────────────────────────────────────
  chrome.contextMenus.create({ id: 'shreyan-text', title: "🛠️ Shreyan's Tools", contexts: ['selection'] })

  // Text manipulation
  chrome.contextMenus.create({ id: 'text-sub-transform', parentId: 'shreyan-text', title: '🔤 Transform Text', contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-word-count',  parentId: 'text-sub-transform', title: '📊 Word Count & Readability', contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-case',        parentId: 'text-sub-transform', title: '🔡 Convert Case', contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-diff',        parentId: 'text-sub-transform', title: '↔️ Compare Text (Diff)', contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-speech',      parentId: 'text-sub-transform', title: '🔊 Read Aloud', contexts: ['selection'] })

  // Encoding / crypto
  chrome.contextMenus.create({ id: 'text-sub-encode', parentId: 'shreyan-text', title: '🔐 Encode / Hash', contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-hash',       parentId: 'text-sub-encode', title: '#️⃣ Generate Hash (MD5/SHA)', contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-base64-enc', parentId: 'text-sub-encode', title: '📦 Encode Base64', contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-base64-dec', parentId: 'text-sub-encode', title: '📦 Decode Base64', contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-html-enc',   parentId: 'text-sub-encode', title: '🏷️ Encode HTML Entities', contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-jwt-decode', parentId: 'text-sub-encode', title: '🔑 Decode JWT', contexts: ['selection'] })

  // Developer tools
  chrome.contextMenus.create({ id: 'text-sub-dev', parentId: 'shreyan-text', title: '💻 Developer Tools', contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-format-code', parentId: 'text-sub-dev', title: '✨ Format / Beautify Code', contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-regex',       parentId: 'text-sub-dev', title: '🔍 Test as Regex', contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-timestamp',   parentId: 'text-sub-dev', title: '🕐 Convert Timestamp', contexts: ['selection'] })

  // Generate from text
  chrome.contextMenus.create({ id: 'text-sub-generate', parentId: 'shreyan-text', title: '⚡ Generate From Text', contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-barcode', parentId: 'text-sub-generate', title: '📊 Generate Barcode', contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-lorem',   parentId: 'text-sub-generate', title: '📄 Generate Lorem Ipsum', contexts: ['selection'] })

  // ── Link Right-Click ───────────────────────────────────────────────────
  chrome.contextMenus.create({ id: 'shreyan-link', title: "🛠️ Shreyan's Tools", contexts: ['link'] })

  chrome.contextMenus.create({ id: 'link-qr',        parentId: 'shreyan-link', title: '📱 Generate QR Code', contexts: ['link'] })
  chrome.contextMenus.create({ id: 'link-og-preview', parentId: 'shreyan-link', title: '👁️ Preview Open Graph', contexts: ['link'] })
  chrome.contextMenus.create({ id: 'link-url-encode', parentId: 'shreyan-link', title: '🔗 Encode URL', contexts: ['link'] })
  chrome.contextMenus.create({ id: 'link-favicon',    parentId: 'shreyan-link', title: '🖼️ Generate Favicon from URL', contexts: ['link'] })

  // ── Page Right-Click ───────────────────────────────────────────────────
  chrome.contextMenus.create({ id: 'shreyan-page', title: "🛠️ Shreyan's Tools", contexts: ['page'] })

  chrome.contextMenus.create({ id: 'page-qr',        parentId: 'shreyan-page', title: '📱 QR Code for this Page', contexts: ['page'] })
  chrome.contextMenus.create({ id: 'page-og-preview', parentId: 'shreyan-page', title: '👁️ Preview OG / Social Tags', contexts: ['page'] })
  chrome.contextMenus.create({ id: 'page-meta-tags',  parentId: 'shreyan-page', title: '🏷️ Inspect Meta Tags', contexts: ['page'] })

  // ── Video Right-Click ──────────────────────────────────────────────────
  chrome.contextMenus.create({ id: 'shreyan-video', title: "🛠️ Shreyan's Tools", contexts: ['video'] })
  chrome.contextMenus.create({ id: 'video-to-gif', parentId: 'shreyan-video', title: '🎞️ Convert to GIF', contexts: ['video'] })
}
```

---

## 11. Data Flow & State Management

### chrome.storage Structure

```typescript
// Complete shape of chrome.storage.local
interface ExtensionStorage {
  // User behaviour
  recentTools: string[]          // tool IDs, max 10, most recent first
  pinnedTools: string[]          // tool IDs, user-managed, max 8
  toolUsageCount: Record<string, number>  // toolId → total uses

  // Preferences
  preferences: {
    theme: 'dark' | 'light' | 'system'
    openInSidePanel: boolean     // use Chrome side panel instead of new tab
    showFloatingButton: boolean  // show FAB on pages
    notifyOnComplete: boolean    // desktop notification when processing completes
    defaultCategory: string | null  // open to this category instead of home
    compactMode: boolean         // smaller tool cards for more density
  }

  // Meta
  installDate: number            // Unix timestamp
  lastVersion: string            // last seen extension version (for update notes)
}

// chrome.storage.session (cleared when browser closes)
interface SessionStorage {
  pendingPrefill: {              // set by service worker, consumed by popup
    toolId: string
    data: PrefillData
  } | null
  currentPageContext: PageContext // set by content script
  currentPageStats: PageStats    // set by content script
}
```

### useStorage Hook

```typescript
// hooks/useStorage.ts
import { useState, useEffect } from 'react'

export function useStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => Promise<void>] {
  const [value, setValue] = useState<T>(defaultValue)

  useEffect(() => {
    chrome.storage.local.get(key, (result) => {
      if (result[key] !== undefined) {
        setValue(result[key])
      }
    })

    // Listen for changes (e.g., from service worker)
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes[key]) {
        setValue(changes[key].newValue ?? defaultValue)
      }
    }
    chrome.storage.local.onChanged.addListener(listener)
    return () => chrome.storage.local.onChanged.removeListener(listener)
  }, [key])

  const set = async (newValue: T) => {
    setValue(newValue)
    await chrome.storage.local.set({ [key]: newValue })
  }

  return [value, set]
}
```

---

## 12. Build System & Tooling

### package.json

```json
{
  "name": "shreyan-tools-extension",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev":    "vite build --watch --mode development",
    "build":  "vite build --mode production",
    "test":   "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "package": "node scripts/package.js",
    "lint":   "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "qrcode": "^1.5.0",
    "chroma-js": "^2.4.0"
  },
  "devDependencies": {
    "@types/chrome": "^0.0.268",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "@vitejs/plugin-react": "^4.3.0",
    "vitest": "^1.6.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@playwright/test": "^1.44.0",
    "jsdom": "^24.0.0"
  }
}
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  build: {
    outDir: 'build',
    emptyOutDir: true,
    minify: mode === 'production',
    sourcemap: mode === 'development',

    rollupOptions: {
      input: {
        popup:          resolve(__dirname, 'popup/src/index.tsx'),
        'service-worker': resolve(__dirname, 'service-worker/service-worker.ts'),
        'content-script': resolve(__dirname, 'content-script/content-script.ts'),
      },
      output: {
        entryFileNames: '[name]/[name].js',
        chunkFileNames: 'shared/[name].js',
        assetFileNames: '[name][extname]',
      },
    },
  },

  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
    'process.env.EXTENSION_ENV': JSON.stringify(mode),
  },
}))
```

### scripts/package.js

```javascript
// Copies manifest, icons, and HTML files into build/, then zips for upload
const fs = require('fs-extra')
const archiver = require('archiver')
const path = require('path')

async function packageExtension() {
  const buildDir = path.resolve('build')
  const distDir = path.resolve('dist')

  // Copy static files into build
  await fs.copy('manifest.json', path.join(buildDir, 'manifest.json'))
  await fs.copy('icons', path.join(buildDir, 'icons'))
  await fs.copy('popup/popup.html', path.join(buildDir, 'popup', 'popup.html'))
  await fs.copy('popup/popup.css', path.join(buildDir, 'popup', 'popup.css'))
  await fs.copy('_locales', path.join(buildDir, '_locales'))

  // Create ZIP
  await fs.ensureDir(distDir)
  const output = fs.createWriteStream(path.join(distDir, 'extension.zip'))
  const archive = archiver('zip', { zlib: { level: 9 } })

  archive.pipe(output)
  archive.directory(buildDir, false)
  await archive.finalize()

  console.log('✅ Extension packaged to dist/extension.zip')
}

packageExtension().catch(console.error)
```

---

## 13. Unit Tests — Complete Test Suite

### Test 1: Tools Registry

```typescript
// tests/unit/tools-registry.test.ts
import { describe, it, expect } from 'vitest'
import { tools, getTool, CATEGORIES } from '../../popup/src/lib/tools-registry'

describe('Tools Registry', () => {
  it('should have no duplicate tool IDs', () => {
    const ids = tools.map(t => t.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('should have all required fields on every tool', () => {
    tools.forEach(tool => {
      expect(tool.id, `${tool.id} missing id`).toBeTruthy()
      expect(tool.name, `${tool.id} missing name`).toBeTruthy()
      expect(tool.description, `${tool.id} missing description`).toBeTruthy()
      expect(tool.category, `${tool.id} missing category`).toBeTruthy()
      expect(tool.icon, `${tool.id} missing icon`).toBeTruthy()
      expect(Array.isArray(tool.tags), `${tool.id} tags must be array`).toBe(true)
    })
  })

  it('should have at least 3 tags per tool for search', () => {
    tools.forEach(tool => {
      expect(tool.tags.length, `${tool.id} needs at least 3 tags`).toBeGreaterThanOrEqual(3)
    })
  })

  it('every tool category should exist in CATEGORIES', () => {
    const categoryIds = CATEGORIES.map(c => c.id)
    tools.forEach(tool => {
      expect(categoryIds, `Category '${tool.category}' not in CATEGORIES`).toContain(tool.category)
    })
  })

  it('getTool should return undefined for non-existent ID', () => {
    expect(getTool('non-existent-tool-xyz')).toBeUndefined()
  })

  it('getTool should return correct tool for valid ID', () => {
    const tool = getTool('background-remover')
    expect(tool?.name).toBe('Background Remover')
  })

  it('tools with hasInlineRunner should have corresponding mini tool', () => {
    const MINI_TOOL_IDS = [
      'password-generator', 'base64', 'hash-generator', 'text-case',
      'word-count', 'qr-code', 'url-encoder', 'json-formatter',
    ]
    tools.filter(t => t.hasInlineRunner).forEach(tool => {
      expect(MINI_TOOL_IDS, `${tool.id} marked hasInlineRunner but no mini tool exists`)
        .toContain(tool.id)
    })
  })
})
```

### Test 2: Context Detector

```typescript
// tests/unit/context-detector.test.ts
import { describe, it, expect } from 'vitest'
import { detectPageContext, getContextualTools } from '../../popup/src/lib/context-detector'

describe('Context Detector', () => {
  it('should detect PDF from URL extension', () => {
    const ctx = detectPageContext({ url: 'https://example.com/document.pdf', title: 'Document' })
    expect(ctx).toBe('pdf')
  })

  it('should detect YouTube as video page', () => {
    const ctx = detectPageContext({ url: 'https://www.youtube.com/watch?v=abc123', title: 'Video' })
    expect(ctx).toBe('video-page')
  })

  it('should detect GitHub as code page', () => {
    const ctx = detectPageContext({ url: 'https://github.com/user/repo', title: 'Repo' })
    expect(ctx).toBe('code-page')
  })

  it('should detect Wikipedia as text-heavy', () => {
    const ctx = detectPageContext({ url: 'https://en.wikipedia.org/wiki/Test', title: 'Test' })
    expect(ctx).toBe('text-heavy')
  })

  it('should return 3-5 contextual tools', () => {
    const tools = getContextualTools('code-page')
    expect(tools.length).toBeGreaterThanOrEqual(3)
    expect(tools.length).toBeLessThanOrEqual(5)
  })

  it('contextual tools should include code formatter for code pages', () => {
    const tools = getContextualTools('code-page')
    const ids = tools.map(t => t.id)
    expect(ids).toContain('code-formatter')
  })

  it('contextual tools should include background-remover for image pages', () => {
    const tools = getContextualTools('image-page')
    const ids = tools.map(t => t.id)
    expect(ids).toContain('background-remover')
  })

  it('should not return undefined tools', () => {
    const allContexts: PageContext[] = ['image-page', 'pdf', 'has-images', 'text-heavy', 'code-page', 'video-page', 'generic']
    allContexts.forEach(ctx => {
      const tools = getContextualTools(ctx)
      expect(tools.every(t => t !== undefined)).toBe(true)
    })
  })
})
```

### Test 3: Mini Tools Logic

```typescript
// tests/unit/mini-tools.test.ts
import { describe, it, expect } from 'vitest'

// Password Generator
import { generatePassword } from '../../popup/src/mini-tools/MiniPasswordGenerator'

describe('Password Generator', () => {
  it('should generate password of correct length', () => {
    const pw = generatePassword({ length: 16, uppercase: true, lowercase: true, numbers: true, symbols: false, excludeAmbiguous: false })
    expect(pw.length).toBe(16)
  })

  it('should not contain symbols when symbols=false', () => {
    const pw = generatePassword({ length: 32, uppercase: true, lowercase: true, numbers: true, symbols: false, excludeAmbiguous: false })
    expect(/[!@#$%^&*]/.test(pw)).toBe(false)
  })

  it('should not contain ambiguous chars when excludeAmbiguous=true', () => {
    const pw = generatePassword({ length: 100, uppercase: true, lowercase: true, numbers: true, symbols: false, excludeAmbiguous: true })
    expect(/[0OlI1]/.test(pw)).toBe(false)
  })

  it('should throw when no character sets selected', () => {
    expect(() => generatePassword({ length: 16, uppercase: false, lowercase: false, numbers: false, symbols: false, excludeAmbiguous: false }))
      .toThrow('At least one character set must be selected')
  })

  it('should generate different passwords each time', () => {
    const opts = { length: 20, uppercase: true, lowercase: true, numbers: true, symbols: true, excludeAmbiguous: false }
    const passwords = new Set(Array.from({ length: 100 }, () => generatePassword(opts)))
    expect(passwords.size).toBeGreaterThan(95)  // allow tiny random collision chance
  })
})

// Base64
import { encodeBase64, decodeBase64 } from '../../popup/src/mini-tools/MiniBase64'

describe('Base64', () => {
  it('should correctly encode ASCII text', () => {
    expect(encodeBase64('Hello, World!')).toBe('SGVsbG8sIFdvcmxkIQ==')
  })

  it('should correctly decode base64', () => {
    expect(decodeBase64('SGVsbG8sIFdvcmxkIQ==')).toBe('Hello, World!')
  })

  it('should handle Unicode characters', () => {
    const original = 'Hello, 世界! 🌍'
    const encoded = encodeBase64(original)
    expect(decodeBase64(encoded)).toBe(original)
  })

  it('should return error for invalid base64', () => {
    const result = decodeBase64('This is not valid base64!!!')
    expect(result).toContain('[Invalid')
  })

  it('should handle empty string', () => {
    expect(encodeBase64('')).toBe('')
    expect(decodeBase64('')).toBe('')
  })
})

// Hash Generator
import { hashText } from '../../popup/src/mini-tools/MiniHashGenerator'

describe('Hash Generator', () => {
  it('should generate correct SHA-256', async () => {
    const hash = await hashText('hello', 'SHA-256')
    expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')
  })

  it('should generate correct SHA-1', async () => {
    const hash = await hashText('hello', 'SHA-1')
    expect(hash).toBe('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d')
  })

  it('should return lowercase hex', async () => {
    const hash = await hashText('test', 'SHA-256')
    expect(hash).toMatch(/^[0-9a-f]+$/)
  })

  it('should return consistent results', async () => {
    const hash1 = await hashText('consistent', 'SHA-256')
    const hash2 = await hashText('consistent', 'SHA-256')
    expect(hash1).toBe(hash2)
  })
})
```

### Test 4: Service Worker Context Menus

```typescript
// tests/unit/service-worker.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CONTEXT_MENU_TOOL_MAP } from '../../service-worker/context-menus'
import { tools } from '../../popup/src/lib/tools-registry'

describe('Context Menu Tool Map', () => {
  it('every context menu entry should map to an existing tool', () => {
    const toolIds = new Set(tools.map(t => t.id))
    Object.entries(CONTEXT_MENU_TOOL_MAP).forEach(([menuId, toolId]) => {
      expect(toolIds, `Menu '${menuId}' maps to non-existent tool '${toolId}'`)
        .toContain(toolId)
    })
  })

  it('should have no duplicate menu IDs', () => {
    const ids = Object.keys(CONTEXT_MENU_TOOL_MAP)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })
})

describe('Storage Schema', () => {
  beforeEach(() => {
    // Mock chrome.storage.local
    const store: Record<string, unknown> = {}
    global.chrome = {
      storage: {
        local: {
          get: vi.fn((key: string | string[], cb: (result: Record<string, unknown>) => void) => {
            const keys = Array.isArray(key) ? key : [key]
            const result: Record<string, unknown> = {}
            keys.forEach(k => { if (store[k] !== undefined) result[k] = store[k] })
            cb(result)
          }),
          set: vi.fn((data: Record<string, unknown>, cb?: () => void) => {
            Object.assign(store, data)
            cb?.()
          }),
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      }
    } as any
  })

  it('trackToolUsage should add tool to recentTools', async () => {
    const { trackToolUsage } = await import('../../service-worker/service-worker')
    await trackToolUsage('background-remover')

    const result = await new Promise<Record<string, unknown>>(resolve => {
      chrome.storage.local.get(['recentTools'], resolve)
    })
    expect(result.recentTools).toContain('background-remover')
  })

  it('recentTools should not exceed 10 items', async () => {
    const { trackToolUsage } = await import('../../service-worker/service-worker')
    for (let i = 0; i < 15; i++) {
      await trackToolUsage(`tool-${i}`)
    }
    const result = await new Promise<Record<string, unknown>>(resolve => {
      chrome.storage.local.get(['recentTools'], resolve)
    })
    expect((result.recentTools as string[]).length).toBeLessThanOrEqual(10)
  })
})
```

### Test 5: Search

```typescript
// tests/unit/search.test.ts
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSearch } from '../../popup/src/hooks/useSearch'

describe('useSearch', () => {
  it('should return empty array for empty query', () => {
    const { result } = renderHook(() => useSearch(''))
    expect(result.current).toHaveLength(0)
  })

  it('should find background remover by exact name', () => {
    const { result } = renderHook(() => useSearch('Background Remover'))
    expect(result.current[0]?.id).toBe('background-remover')
  })

  it('should find tool by partial name', () => {
    const { result } = renderHook(() => useSearch('bg remov'))
    const ids = result.current.map(t => t.id)
    expect(ids).toContain('background-remover')
  })

  it('should find tool by tag', () => {
    const { result } = renderHook(() => useSearch('transparent'))
    const ids = result.current.map(t => t.id)
    expect(ids).toContain('background-remover')
  })

  it('should return max 8 results', () => {
    const { result } = renderHook(() => useSearch('a'))  // single letter matches many
    expect(result.current.length).toBeLessThanOrEqual(8)
  })

  it('should return exact match first', () => {
    const { result } = renderHook(() => useSearch('JSON Formatter'))
    expect(result.current[0]?.id).toBe('json-formatter')
  })

  it('should handle case-insensitive search', () => {
    const { result: lower } = renderHook(() => useSearch('password generator'))
    const { result: upper } = renderHook(() => useSearch('PASSWORD GENERATOR'))
    expect(lower.current[0]?.id).toBe(upper.current[0]?.id)
  })
})
```

---

## 14. Chrome Web Store Submission

### Required Assets (prepare before submission)

| Asset | Dimensions | Notes |
|---|---|---|
| Icon 128×128 | 128×128 PNG | Used in Chrome Web Store listing |
| Screenshot 1 | 1280×800 PNG | Show popup with home view |
| Screenshot 2 | 1280×800 PNG | Show right-click context menu on an image |
| Screenshot 3 | 1280×800 PNG | Show mini tool runner (password generator) |
| Screenshot 4 | 1280×800 PNG | Show tool result on website (background removed) |
| Promotional tile | 440×280 PNG | Used in Chrome Web Store featured section |
| Small promotional | 920×680 PNG | Optional — for featured placement |

### Store Listing Copy

**Name:** Shreyan's Tools

**Summary (132 chars max):**
`110+ free tools: remove backgrounds, convert files, format code. All private — nothing leaves your browser.`

**Description:**
```
Shreyan's Tools gives you instant access to 110+ powerful browser utilities — directly from any webpage. No accounts. No uploads. No costs. Everything runs in your browser.

WHAT IT DOES
• Right-click any image to remove background, compress, convert, or extract colours
• Right-click selected text to encode/hash/format/convert it
• Right-click any link to generate a QR code or preview social sharing cards
• Open the popup to access all 110+ tools organised by category
• Use the search bar to find any tool in under a second

TOOLS INCLUDED
🖼️ Image: Background removal, compression, resizing, format conversion, OCR, watermarking, EXIF viewer
📄 Documents: PDF merge/split/compress, image-to-PDF, PDF-to-image
💻 Text & Code: JSON formatter, Base64, regex tester, code formatter, diff checker, case converter
🔒 Security: Password generator, hash generator, JWT decoder/generator, encryption tools
🎨 Design: CSS gradient builder, box shadow generator, colour contrast checker, favicon generator
📊 Data: CSV/JSON converter, fake data generator, barcode/QR code generator
🌐 Web & SEO: Meta tag generator, OG preview, sitemap generator, robots.txt builder
🔄 Converters: Unit converter, timezone converter, timestamp converter, base converter
...and 60+ more

COMPLETELY PRIVATE
Every tool runs in your browser using WebAssembly and JavaScript. Your files, images, and data never leave your device. No server processing. No analytics on your content.

FREE FOREVER
All 110+ tools are permanently free. No subscription required.
```

### Privacy Policy URL
Create a page at `https://tools.shreyannarula.com/privacy` with:
- What data is collected: none (no user data collected by the extension)
- What permissions are used and why (contextMenus, activeTab, storage, etc.)
- Contact email for privacy concerns

### Submission Checklist

- [ ] All screenshots prepared at correct dimensions
- [ ] Privacy policy page live at `https://tools.shreyannarula.com/privacy`
- [ ] Extension tested in Chrome, Edge (Chromium), and Brave
- [ ] All context menus tested with images, selected text, links, and videos
- [ ] Popup tested at 100%, 125%, 150% display scaling
- [ ] Side panel tested in Chrome 116+
- [ ] No console errors or warnings in production build
- [ ] `manifest.json` version matches `package.json` version
- [ ] Extension ZIP under 128MB (Chrome Web Store limit)
- [ ] All unit tests passing (`npm test`)
- [ ] Developer account fee paid ($5 one-time)

---

## 15. Future-Proofing — Adding Tools Without Breaking Anything

### Adding a New Tool (Complete Checklist)

When tools 61–110 are ready, adding each one to the extension requires **exactly 3 steps**:

**Step 1: Add to tools-registry.ts**
```typescript
// Add ONE entry to the tools array in lib/tools-registry.ts
{
  id: 'new-tool-id',
  name: 'New Tool Name',
  description: 'One sentence what it does.',
  category: 'utilities',              // must be an existing category ID
  icon: '🔧',
  tags: ['tag1', 'tag2', 'tag3'],    // minimum 3 tags
  hasInlineRunner: false,             // true only if mini tool exists
}
```

**Step 2: Add context menu entry (optional — only if right-click makes sense)**
```typescript
// In service-worker/context-menus.ts
// Add to CONTEXT_MENU_TOOL_MAP
'new-menu-id': 'new-tool-id',

// Add chrome.contextMenus.create() call in buildContextMenus()
// Place it in the appropriate parent group
```

**Step 3: Create mini tool (optional — only if hasInlineRunner: true)**
```typescript
// Create popup/src/mini-tools/MiniNewTool.tsx
// Register in MINI_TOOL_MAP in MiniToolRunner.tsx
```

**That's it.** The homepage category grid, search, recent tools, and category view all update automatically from the tools registry. No other files need changes.

### Category Capacity Management

Each category should have a comfortable number of tools. When a category exceeds 20 tools:
- Split it into two sub-categories
- Add a new entry to `CATEGORIES` array
- Update all affected tools' `category` field

The popup UI handles any number of tools per category via scrolling within the category view.

### Version Compatibility

The extension and website share `lib/tools-registry.ts`. Maintain this as a single source of truth by either:
1. **Shared package approach (recommended):** Extract the registry into a separate npm package `@shreyan-tools/registry` that both the extension and website import.
2. **Manual sync approach:** Keep both files in sync manually. Add a CI check that compares `extension/popup/src/lib/tools-registry.ts` and `website/lib/tools-registry.ts` and fails if they differ.

---

## 16. Critical Rules & Edge Cases

**Rule E1 — Service workers are ephemeral. Never store state in module-level variables.**
Chrome can terminate and restart a service worker at any time. Any in-memory state is lost on restart. Always read from `chrome.storage.local` or `chrome.storage.session` — never from a module-level variable like `let currentTab = null`.

**Rule E2 — Always return `true` from `chrome.runtime.onMessage.addListener` if the response is async.**
If your message handler does any async work (even `await chrome.storage.local.get(...)`), the message channel will close before the response is sent unless you `return true` synchronously. This is the single most common bug in Chrome extension development.

**Rule E3 — context menus must be rebuilt on every `onInstalled` and `onStartup`.**
Context menus do not persist across extension updates or Chrome restarts. Always call `buildContextMenus()` in both `chrome.runtime.onInstalled` and `chrome.runtime.onStartup`. Call `chrome.contextMenus.removeAll()` before rebuilding to prevent duplicate entries.

**Rule E4 — Popup closes when user clicks outside. Design for interrupted flows.**
Users will open the popup, start configuring a tool, then accidentally click outside and close it. The popup state is lost. For mini tools with non-trivial input (not password generator), save input to `chrome.storage.session` as the user types so it's restored on next open.

**Rule E5 — The floating button (FAB) must not break any website.**
Never use `document.body.style.marginBottom` or any layout-affecting CSS from the content script. The FAB must be `position: fixed` with a very high `z-index` (2147483647 = max). Use a Shadow DOM to fully isolate extension styles from page styles.

**Rule E6 — Shadow DOM for FAB is mandatory.**
Without a Shadow DOM, the extension's CSS will bleed into some pages and some pages' CSS will bleed into the FAB (e.g., a page that sets `* { all: unset }` will destroy the FAB's styles). Always create FAB elements inside a Shadow DOM.

```typescript
// Correct FAB injection with Shadow DOM
const host = document.createElement('div')
host.id = 'shreyan-tools-host'
const shadow = host.attachShadow({ mode: 'closed' })
// Inject all FAB HTML and CSS into shadow, not into document.body directly
document.body.appendChild(host)
```

**Rule E7 — Never call `chrome.action.openPopup()` in Chrome 116 and below.**
`chrome.action.openPopup()` was added in Chrome 127. For Chrome 116–126, it will throw. Use feature detection:
```typescript
if (chrome.action.openPopup) {
  await chrome.action.openPopup()
} else {
  // Fallback: open side panel or new tab
  chrome.tabs.create({ url: chrome.runtime.getURL('popup/popup.html') })
}
```

**Rule E8 — Test on Chrome, Edge, and Brave. Not just Chrome.**
All three are Chromium-based and support Manifest V3. Edge and Brave have slightly different behaviour for:
- Side panel API (Edge has its own implementation)
- Notification permissions (Brave blocks by default)
- WASM execution (Brave's strict mode may block WASM)
Test all three browsers before submitting.

**Rule E9 — The `offscreen` API is required for WASM in service workers.**
Service workers cannot run WASM directly in Chrome extensions. To run background removal or FFmpeg from a context menu click (without opening the popup), create an offscreen document:
```typescript
await chrome.offscreen.createDocument({
  url: chrome.runtime.getURL('offscreen/offscreen.html'),
  reasons: [chrome.offscreen.Reason.BLOBS],
  justification: 'Run WASM processing for image tools',
})
```
The offscreen document is a hidden page that can run WASM and communicate back via `chrome.runtime.sendMessage`.

**Rule E10 — Image URLs from context menu `info.srcUrl` may be data URLs or blob URLs.**
`info.srcUrl` can be: a regular HTTPS URL, a `data:image/...` base64 URL, a `blob:` URL, or `chrome-extension://...`. Handle all cases:
```typescript
async function fetchImageFromUrl(srcUrl: string): Promise<Blob> {
  if (srcUrl.startsWith('data:')) {
    // Decode base64 data URL
    const [, data] = srcUrl.split(',')
    const bytes = atob(data)
    const arr = new Uint8Array(bytes.length).map((_, i) => bytes.charCodeAt(i))
    return new Blob([arr], { type: srcUrl.split(';')[0].split(':')[1] })
  }
  // Regular URL (including blob:) — fetch it
  const response = await fetch(srcUrl)
  return response.blob()
}
```

**Rule E11 — Never hardcode `tools.shreyannarula.com` in the extension — use a constant.**
```typescript
// lib/constants.ts
export const SITE_BASE_URL = 'https://tools.shreyannarula.com'
export const TOOL_BASE_URL = `${SITE_BASE_URL}/tools`
```
If the domain ever changes, update one file.

**Rule E12 — The popup must render completely in under 100ms.**
Chrome shows a spinner if the popup takes more than 100–200ms to paint. All data (recent tools, pinned tools, preferences) must be loaded from `chrome.storage.local` synchronously on render or show a skeleton state. Never show a blank white popup.

```typescript
// Pre-warm storage in service worker so popup can read sync
// Store frequently-needed data in chrome.storage.session for faster access
```

---

*Extension guide complete. This document covers all 40 tools (and is compatible with tools 41–110 via the registry pattern). No re-architecture needed when adding future tools.*
*Last updated: May 2026. For tools.shreyannarula.com Chrome Extension.*
