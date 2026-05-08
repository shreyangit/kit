import { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { SearchBar } from './components/SearchBar'
import { HomeView } from './components/HomeView'
import { CategoryView } from './components/CategoryView'
import { MiniToolRunner } from './components/MiniToolRunner'
import { SearchResultsView } from './components/SearchResultsView'
import { usePageContext } from './hooks/usePageContext'
import { useStorage } from './hooks/useStorage'
import { TOOL_BASE_URL } from '../../lib/constants'
import type { PrefillData } from '../../types'

type View =
  | { type: 'home' }
  | { type: 'search'; query: string }
  | { type: 'category'; categoryId: string }
  | { type: 'mini-tool'; toolId: string; prefillData?: PrefillData }

export function App() {
  const [view, setView] = useState<View>({ type: 'home' })
  const [searchQuery, setSearchQuery] = useState('')
  const pageContext = usePageContext()
  const [recentTools] = useStorage<string[]>('recentTools', [])
  const [pinnedTools] = useStorage<string[]>('pinnedTools', [])

  // Pick up prefill data set by service worker when opened from context menu
  useEffect(() => {
    chrome.storage.session.get(['pendingPrefill'], (result) => {
      const prefill = result['pendingPrefill'] as { toolId: string; data: PrefillData } | undefined
      if (prefill?.toolId) {
        setView({ type: 'mini-tool', toolId: prefill.toolId, prefillData: prefill.data })
        chrome.storage.session.remove(['pendingPrefill'])
      }
    })
  }, [])

  function handleSearch(query: string) {
    setSearchQuery(query)
    setView(query.trim() ? { type: 'search', query } : { type: 'home' })
  }

  function handleToolClick(toolId: string, prefillData?: PrefillData) {
    // Check hasInlineRunner from the registry
    import('../../lib/tools-registry').then(({ getTool }) => {
      const tool = getTool(toolId)
      if (!tool) return
      if (tool.hasInlineRunner) {
        setView({ type: 'mini-tool', toolId, prefillData })
      } else {
        openToolInTab(toolId, prefillData)
      }
      // Track usage via service worker
      chrome.runtime.sendMessage({ type: 'TRACK_USAGE', toolId })
    })
  }

  function handleOpenFullTab(toolId: string, prefillData?: PrefillData) {
    openToolInTab(toolId, prefillData)
    window.close()
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
            onOpenFullTab={() => handleOpenFullTab(view.toolId, view.prefillData)}
          />
        )}
      </div>
    </div>
  )
}

function openToolInTab(toolId: string, prefillData?: PrefillData) {
  const params = new URLSearchParams()
  if (prefillData?.text)     params.set('text', prefillData.text)
  if (prefillData?.imageUrl) params.set('imageUrl', prefillData.imageUrl)
  if (prefillData?.url)      params.set('url', prefillData.url)
  const qs = params.toString()
  chrome.tabs.create({ url: `${TOOL_BASE_URL}/${toolId}${qs ? '?' + qs : ''}` })
  window.close()
}
