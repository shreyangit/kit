import { getTool } from '../../../lib/tools-registry'
import type { PageContext } from '../../../types'

export function getContextualTools(context: PageContext) {
  const toolMap: Record<PageContext, string[]> = {
    'image-page':  ['background-remover', 'image-compressor', 'image-converter', 'exif-viewer', 'color-palette'],
    'pdf':         ['pdf-merger', 'pdf-to-image', 'pdf-compressor', 'image-to-pdf'],
    'has-images':  ['background-remover', 'image-compressor', 'image-watermark', 'image-converter'],
    'text-heavy':  ['word-count', 'text-case', 'lorem-ipsum', 'text-to-speech', 'diff-checker'],
    'code-page':   ['code-formatter', 'json-formatter', 'regex-tester', 'hash-generator', 'base64'],
    'video-page':  ['video-to-gif', 'audio-trimmer'],
    'form-page':   ['password-generator', 'fake-data-generator', 'lorem-ipsum'],
    'generic':     ['password-generator', 'qr-code', 'color-converter', 'unit-converter', 'unix-timestamp'],
  }

  return (toolMap[context] ?? toolMap.generic)
    .map(id => getTool(id))
    .filter((t): t is NonNullable<typeof t> => t !== undefined)
    .slice(0, 5)
}

export function getContextLabel(context: PageContext): string {
  const labels: Record<PageContext, string> = {
    'image-page':  'Image tools for this page',
    'pdf':         'PDF tools',
    'has-images':  'Image tools',
    'text-heavy':  'Text tools for this content',
    'code-page':   'Developer tools',
    'video-page':  'Video tools',
    'form-page':   'Form helper tools',
    'generic':     'Quick tools',
  }
  return labels[context]
}
