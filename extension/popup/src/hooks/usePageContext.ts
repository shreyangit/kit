import { useState, useEffect } from 'react'
import type { PageContext } from '../../../types'

export function usePageContext(): PageContext {
  const [context, setContext] = useState<PageContext>('generic')

  useEffect(() => {
    // Read page context stored by content script via service worker
    chrome.storage.session.get(['currentPageContext'], (result) => {
      if (result['currentPageContext']) {
        setContext(result['currentPageContext'] as PageContext)
      } else {
        // Fallback: try to detect from active tab URL
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tab = tabs[0]
          if (!tab?.url) return
          const url = tab.url
          if (url.endsWith('.pdf') || url.includes('.pdf?')) {
            setContext('pdf')
          } else if (url.includes('youtube.com/watch') || url.includes('vimeo.com/')) {
            setContext('video-page')
          } else if (url.includes('github.com') || url.includes('stackoverflow.com') || url.includes('codepen.io')) {
            setContext('code-page')
          } else if (url.includes('wikipedia.org') || url.includes('medium.com') || url.includes('dev.to')) {
            setContext('text-heavy')
          } else {
            setContext('generic')
          }
        })
      }
    })
  }, [])

  return context
}
