// scripts/verify-registry-sync.js
// CI script: compares tool IDs in extension vs. website registry.
// Run `npm run verify-sync`. Fails if website has IDs not in extension.

const fs = require('fs')
const path = require('path')

const WEBSITE_REGISTRY = path.resolve(__dirname, '..', '..', 'lib', 'tools-registry.ts')
const EXT_REGISTRY     = path.resolve(__dirname, '..', 'lib', 'tools-registry.ts')

function extractIds(filepath) {
  const content = fs.readFileSync(filepath, 'utf8')
  const matches = [...content.matchAll(/id:\s*['"]([a-z0-9-]+)['"]/g)]
  return new Set(matches.map(m => m[1]))
}

const siteIds = extractIds(WEBSITE_REGISTRY)
const extIds  = extractIds(EXT_REGISTRY)

const missingFromExt  = [...siteIds].filter(id => !extIds.has(id))
const extraInExt      = [...extIds].filter(id => !siteIds.has(id))

let hasError = false

if (missingFromExt.length > 0) {
  console.error('❌ Tools in website registry NOT in extension registry:')
  missingFromExt.forEach(id => console.error(`   - ${id}`))
  hasError = true
}

if (extraInExt.length > 0) {
  console.warn('⚠  Tools in extension registry NOT in website registry (may be extension-only):')
  extraInExt.forEach(id => console.warn(`   - ${id}`))
}

if (!hasError) {
  console.log(`✅ Registry sync verified — ${siteIds.size} tools matched`)
} else {
  process.exit(1)
}
