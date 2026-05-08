// Shared TypeScript types used across popup, service worker, and content script

export interface PrefillData {
  text?: string
  imageUrl?: string
  url?: string
  fileDataUrl?: string   // base64 data URL for small files passed via context menu
  pageUrl?: string
}

export type PageContext =
  | 'image-page'
  | 'pdf'
  | 'has-images'
  | 'text-heavy'
  | 'code-page'
  | 'video-page'
  | 'form-page'
  | 'generic'

export interface PageStats {
  totalImages: number
  largeImageCount: number
  wordCount: number
  hasForms: boolean
  hasVideo: boolean
  hasCode: boolean
}

export interface ExtensionPreferences {
  theme: 'dark' | 'light' | 'system'
  openInSidePanel: boolean
  showFloatingButton: boolean
  notifyOnComplete: boolean
  defaultCategory: string | null
  compactMode: boolean
}

export type ExtensionMessage =
  | { type: 'PAGE_STATS'; payload: { url: string; title: string; stats: PageStats } }
  | { type: 'GET_PAGE_STATS' }
  | { type: 'GET_SELECTED_IMAGE' }
  | { type: 'OPEN_TOOL'; toolId: string; prefillData?: PrefillData }
  | { type: 'TRACK_USAGE'; toolId: string }
