// content-script/content-script.ts
import { detectPageStats } from './context-detector'
import { injectFloatingButton } from './floating-button'

let initialised = false

async function init() {
  if (initialised) return
  initialised = true

  const stats = detectPageStats()

  // Report page stats to service worker (stored in session for popup to read)
  chrome.runtime.sendMessage({
    type: 'PAGE_STATS',
    payload: { url: window.location.href, title: document.title, stats },
  })

  // Check user preference for FAB before injecting (Rule E5)
  chrome.storage.local.get('preferences', (result) => {
    const prefs = result['preferences']
    const showFab = prefs?.showFloatingButton !== false  // default true
    if (showFab && (stats.largeImageCount > 0 || stats.hasVideo || stats.hasCode)) {
      injectFloatingButton(stats)
    }
  })

  // Respond to requests from service worker
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'GET_PAGE_STATS') {
      sendResponse(detectPageStats())
      return true
    }
  })
}

// Run when page is idle
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
