// scripts/package.js
// Copies static files into build/, then ZIPs to dist/extension.zip for Chrome Web Store upload.

const fs = require('fs-extra')
const archiver = require('archiver')
const path = require('path')

async function packageExtension() {
  const buildDir = path.resolve(__dirname, '..', 'build')
  const distDir  = path.resolve(__dirname, '..', 'dist')

  console.log('📦 Packaging extension…')

  // Copy static assets into build/
  await fs.copy(path.resolve(__dirname, '..', 'manifest.json'),      path.join(buildDir, 'manifest.json'))
  await fs.copy(path.resolve(__dirname, '..', 'icons'),              path.join(buildDir, 'icons'))
  await fs.copy(path.resolve(__dirname, '..', 'popup', 'popup.html'), path.join(buildDir, 'popup', 'popup.html'))
  await fs.copy(path.resolve(__dirname, '..', 'popup', 'popup.css'),  path.join(buildDir, 'popup', 'popup.css'))
  await fs.copy(path.resolve(__dirname, '..', '_locales'),            path.join(buildDir, '_locales'))

  console.log('✅ Static files copied')

  // ZIP build/ → dist/extension.zip
  await fs.ensureDir(distDir)
  const zipPath = path.join(distDir, 'extension.zip')
  const output  = fs.createWriteStream(zipPath)
  const archive = archiver('zip', { zlib: { level: 9 } })

  await new Promise((resolve, reject) => {
    output.on('close', resolve)
    archive.on('error', reject)
    archive.pipe(output)
    archive.directory(buildDir, false)
    archive.finalize()
  })

  const size = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(2)
  console.log(`✅ Extension packaged → dist/extension.zip (${size} MB)`)
  console.log('   Upload to: https://chrome.google.com/webstore/devconsole')
}

packageExtension().catch(err => {
  console.error('❌ Package failed:', err)
  process.exit(1)
})
