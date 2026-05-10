import { lazy, Suspense } from 'react'
import { getTool } from '../../../lib/tools-registry'
import type { PrefillData } from '../../../types'

// Lazy load each mini tool — they only load when the user navigates to them
const MINI_TOOL_MAP: Record<string, React.LazyExoticComponent<React.ComponentType<{ prefillData?: PrefillData }>>> = {
  // Text & Code — always inline
  'password-generator': lazy(() => import('../mini-tools/MiniPasswordGenerator').then(m => ({ default: m.MiniPasswordGenerator }))),
  'base64':             lazy(() => import('../mini-tools/MiniBase64').then(m => ({ default: m.MiniBase64 }))),
  'hash-generator':     lazy(() => import('../mini-tools/MiniHashGenerator').then(m => ({ default: m.MiniHashGenerator }))),
  'text-case':          lazy(() => import('../mini-tools/MiniTextCase').then(m => ({ default: m.MiniTextCase }))),
  'word-count':         lazy(() => import('../mini-tools/MiniWordCount').then(m => ({ default: m.MiniWordCount }))),
  'qr-code':            lazy(() => import('../mini-tools/MiniQRCode').then(m => ({ default: m.MiniQRCode }))),
  'url-encoder':        lazy(() => import('../mini-tools/MiniUrlEncoder').then(m => ({ default: m.MiniUrlEncoder }))),
  'json-formatter':     lazy(() => import('../mini-tools/MiniJsonFormatter').then(m => ({ default: m.MiniJsonFormatter }))),
  'regex-tester':       lazy(() => import('../mini-tools/MiniRegexTester').then(m => ({ default: m.MiniRegexTester }))),
  'lorem-ipsum':        lazy(() => import('../mini-tools/MiniLoremIpsum').then(m => ({ default: m.MiniLoremIpsum }))),
  'color-converter':    lazy(() => import('../mini-tools/MiniColorConverter').then(m => ({ default: m.MiniColorConverter }))),
  'unit-converter':     lazy(() => import('../mini-tools/MiniUnitConverter').then(m => ({ default: m.MiniUnitConverter }))),
  'unix-timestamp':     lazy(() => import('../mini-tools/MiniTimestamp').then(m => ({ default: m.MiniTimestamp }))),
  'timezone-converter': lazy(() => import('../mini-tools/MiniTimezone').then(m => ({ default: m.MiniTimezone }))),
  'diff-checker':       lazy(() => import('../mini-tools/MiniDiff').then(m => ({ default: m.MiniDiff }))),
  'aspect-ratio':       lazy(() => import('../mini-tools/MiniAspectRatio').then(m => ({ default: m.MiniAspectRatio }))),
  'char-counter':       lazy(() => import('../mini-tools/MiniCharCounter').then(m => ({ default: m.MiniCharCounter }))),
  'base-converter':     lazy(() => import('../mini-tools/MiniNumberBase').then(m => ({ default: m.MiniNumberBase }))),
  'html-entities':      lazy(() => import('../mini-tools/MiniHTMLEntities').then(m => ({ default: m.MiniHTMLEntities }))),
  'jwt-decoder':        lazy(() => import('../mini-tools/MiniJWTDecoder').then(m => ({ default: m.MiniJWTDecoder }))),
  'code-formatter':     lazy(() => import('../mini-tools/MiniCodeFormatter').then(m => ({ default: m.MiniCodeFormatter }))),

  // Image — inline WASM/Canvas runners (new — these were previously redirecting to site)
  'background-remover': lazy(() => import('../mini-tools/MiniBackgroundRemover').then(m => ({ default: m.MiniBackgroundRemover }))),
  'image-compressor':   lazy(() => import('../mini-tools/MiniImageCompressor').then(m => ({ default: m.MiniImageCompressor }))),
  'image-converter':    lazy(() => import('../mini-tools/MiniImageConverter').then(m => ({ default: m.MiniImageConverter }))),
  'image-watermark':    lazy(() => import('../mini-tools/MiniImageWatermark').then(m => ({ default: m.MiniImageWatermark }))),
  'color-palette':      lazy(() => import('../mini-tools/MiniColorPalette').then(m => ({ default: m.MiniColorPalette }))),
}

interface Props {
  toolId: string
  prefillData?: PrefillData
  onBack: () => void
  onOpenFullTab: () => void
}

function MiniLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', color: 'var(--text-secondary)', fontSize: '12px', gap: '8px' }}>
      <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
      Loading…
    </div>
  )
}

export function MiniToolRunner({ toolId, prefillData, onBack, onOpenFullTab }: Props) {
  const MiniTool = MINI_TOOL_MAP[toolId]
  const tool = getTool(toolId)

  if (!MiniTool) {
    // No inline runner — open full tab
    onOpenFullTab()
    return null
  }

  return (
    <div className="mini-tool-runner">
      <div className="mini-tool-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <span className="mini-tool-title">{tool?.name ?? toolId}</span>
        <button className="open-full-btn" onClick={onOpenFullTab} title="Open in full tab">
          Full page
        </button>
      </div>
      <div className="mini-tool-body">
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <Suspense fallback={<MiniLoader />}>
          <MiniTool prefillData={prefillData} />
        </Suspense>
      </div>
    </div>
  )
}
