// service-worker/service-worker.ts
// Background service worker — handles context menus, storage, badge, and message routing.
// RULE E1: No module-level mutable state. Always read from chrome.storage.

import { buildContextMenus, CONTEXT_MENU_TOOL_MAP } from './context-menus'
import { TOOL_BASE_URL, WELCOME_URL } from '../lib/constants'
import { getTool } from '../lib/tools-registry'
import type { PrefillData, ExtensionPreferences } from '../types'

// ── Lifecycle ────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async (details) => {
  // Always rebuild menus — they are wiped on every install/update
  await chrome.contextMenus.removeAll()
  buildContextMenus()

  if (details.reason === 'install') {
    await chrome.storage.local.set({
      recentTools: [],
      pinnedTools: [],
      toolUsageCount: {},
      preferences: {
        theme: 'dark',
        openInSidePanel: false,
        showFloatingButton: true,  // on by default, context-aware
        notifyOnComplete: true,
        defaultCategory: null,
        compactMode: false,
      } satisfies ExtensionPreferences,
      installDate: Date.now(),
      lastVersion: chrome.runtime.getManifest().version,
    })
    // Open welcome tab on first install
    chrome.tabs.create({ url: WELCOME_URL })
  }

  if (details.reason === 'update') {
    // Update stored version for "what's new" display
    await chrome.storage.local.set({ lastVersion: chrome.runtime.getManifest().version })
  }
})

// Menus don't survive Chrome restart — rebuild on every startup (Rule E3)
chrome.runtime.onStartup.addListener(() => {
  buildContextMenus()
})

// ── Context Menu Click Handler ────────────────────────────────────────────────

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return

  const toolId = CONTEXT_MENU_TOOL_MAP[info.menuItemId as string]
  if (!toolId) return

  // Build prefill data from what Chrome tells us about the click target
  const prefillData: PrefillData = {}
  if (info.srcUrl)       prefillData.imageUrl = info.srcUrl
  if (info.selectionText) prefillData.text = info.selectionText.slice(0, 5000)
  if (info.linkUrl)      prefillData.url = info.linkUrl
  if (info.pageUrl)      prefillData.pageUrl = info.pageUrl

  const tool = getTool(toolId)
  if (!tool) return

  // Store prefill in session — popup will pick it up on open (Rule E4)
  await chrome.storage.session.set({ pendingPrefill: { toolId, data: prefillData } })

  if (tool.hasInlineRunner) {
    // Try to open popup. chrome.action.openPopup() is Chrome 127+ only (Rule E7)
    if (typeof chrome.action.openPopup === 'function') {
      try {
        await chrome.action.openPopup()
      } catch {
        // Fallback: open popup.html as a new tab
        chrome.tabs.create({ url: chrome.runtime.getURL('popup/popup.html') })
      }
    } else {
      chrome.tabs.create({ url: chrome.runtime.getURL('popup/popup.html') })
    }
  } else {
    // Open the full tool page in a new tab (or side panel based on preference)
    const prefs = await getPreferences()
    if (prefs.openInSidePanel && chrome.sidePanel?.open) {
      await chrome.sidePanel.open({ tabId: tab.id })
    } else {
      const params = buildURLParams(prefillData)
      chrome.tabs.create({ url: `${TOOL_BASE_URL}/${toolId}${params}` })
    }
  }

  // Track usage for "Recent" strip
  await trackToolUsage(toolId)
})

// ── Message Handler ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // RULE E2: Must return true immediately if any async work is done
  ;(async () => {
    switch (message.type) {
      case 'OPEN_TOOL': {
        const { toolId, prefillData } = message
        const tool = getTool(toolId)
        if (!tool) break
        if (tool.hasInlineRunner) {
          await chrome.storage.session.set({ pendingPrefill: { toolId, data: prefillData ?? {} } })
          chrome.action.openPopup?.()
        } else {
          const params = buildURLParams(prefillData ?? {})
          chrome.tabs.create({ url: `${TOOL_BASE_URL}/${toolId}${params}` })
        }
        await trackToolUsage(toolId)
        sendResponse({ ok: true })
        break
      }
      case 'TRACK_USAGE': {
        await trackToolUsage(message.toolId)
        sendResponse({ ok: true })
        break
      }
      case 'PAGE_STATS': {
        // Content script reports page stats — store in session for popup to read
        await chrome.storage.session.set({
          currentPageStats: message.payload.stats,
        })
        sendResponse({ ok: true })
        break
      }
      default:
        sendResponse({ ok: false, error: 'Unknown message type' })
    }
  })()
  return true  // Keep message channel open for async response (Rule E2)
})

// ── Badge Management ──────────────────────────────────────────────────────────

export async function setBadge(text: string, color = '#6366f1') {
  await chrome.action.setBadgeText({ text })
  await chrome.action.setBadgeBackgroundColor({ color })
}

export async function clearBadge() {
  await chrome.action.setBadgeText({ text: '' })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getPreferences(): Promise<ExtensionPreferences> {
  const { preferences } = await chrome.storage.local.get('preferences')
  return (preferences ?? {}) as ExtensionPreferences
}

export async function trackToolUsage(toolId: string) {
  const { recentTools = [], toolUsageCount = {} } = await chrome.storage.local.get([
    'recentTools', 'toolUsageCount',
  ]) as { recentTools: string[]; toolUsageCount: Record<string, number> }

  // Dedupe + prepend + cap at 10
  const updatedRecent = [toolId, ...recentTools.filter(id => id !== toolId)].slice(0, 10)
  const updatedCount = { ...toolUsageCount, [toolId]: (toolUsageCount[toolId] ?? 0) + 1 }

  await chrome.storage.local.set({ recentTools: updatedRecent, toolUsageCount: updatedCount })
}

function buildURLParams(prefillData: PrefillData): string {
  const params = new URLSearchParams()
  if (prefillData.text)     params.set('text', prefillData.text)
  if (prefillData.imageUrl) params.set('imageUrl', prefillData.imageUrl)
  if (prefillData.url)      params.set('url', prefillData.url)
  const str = params.toString()
  return str ? '?' + str : ''
}
