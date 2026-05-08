// content-script/context-detector.ts
import type { PageStats } from '../types'

export function detectPageStats(): PageStats {
  const images = Array.from(document.querySelectorAll('img'))
  const largeImages = images.filter(img => img.naturalWidth > 300 && img.naturalHeight > 300)
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
