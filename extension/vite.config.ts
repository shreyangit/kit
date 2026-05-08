import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'
import path from 'path'

// Simple plugin to copy extension static files after build
function copyExtensionFiles() {
  return {
    name: 'copy-extension-files',
    closeBundle() {
      const copies = [
        { src: 'manifest.json',    dest: 'build/manifest.json' },
        { src: 'popup/popup.html', dest: 'build/popup/popup.html' },
        { src: 'popup/popup.css',  dest: 'build/popup/popup.css' },
      ]
      for (const { src, dest } of copies) {
        if (fs.existsSync(src)) {
          fs.mkdirSync(path.dirname(dest), { recursive: true })
          fs.copyFileSync(src, dest)
        }
      }
      // Copy icons dir
      if (fs.existsSync('icons')) {
        fs.mkdirSync('build/icons', { recursive: true })
        for (const f of fs.readdirSync('icons')) {
          fs.copyFileSync(`icons/${f}`, `build/icons/${f}`)
        }
      }
      // Copy _locales dir recursively
      function copyDir(src: string, dest: string) {
        fs.mkdirSync(dest, { recursive: true })
        for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
          const s = path.join(src, entry.name)
          const d = path.join(dest, entry.name)
          if (entry.isDirectory()) copyDir(s, d)
          else fs.copyFileSync(s, d)
        }
      }
      if (fs.existsSync('_locales')) copyDir('_locales', 'build/_locales')
      console.log('✓ Extension static files copied to build/')
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), copyExtensionFiles()],

  build: {
    outDir: 'build',
    emptyOutDir: true,
    minify: mode === 'production',
    sourcemap: mode === 'development',
    target: 'chrome116',

    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup/src/index.tsx'),
        'service-worker': resolve(__dirname, 'service-worker/service-worker.ts'),
        'content-script': resolve(__dirname, 'content-script/content-script.ts'),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'popup')           return 'popup/popup.js'
          if (chunk.name === 'service-worker')  return 'service-worker/service-worker.js'
          if (chunk.name === 'content-script')  return 'content-script/content-script.js'
          return '[name]/[name].js'
        },
        chunkFileNames: 'shared/[name]-[hash].js',
        assetFileNames: '[name][extname]',
        manualChunks: undefined,
      },
    },
  },

  resolve: {
    alias: { '@': resolve(__dirname, '.') },
  },

  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['popup/src/lib/**', 'popup/src/hooks/**', 'popup/src/mini-tools/**'],
    },
  },
}))
