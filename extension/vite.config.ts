import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [react()],

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
        // Keep each entry in its own directory matching the extension structure
        entryFileNames: (chunk) => {
          if (chunk.name === 'popup') return 'popup/popup.js'
          if (chunk.name === 'service-worker') return 'service-worker/service-worker.js'
          if (chunk.name === 'content-script') return 'content-script/content-script.js'
          return '[name]/[name].js'
        },
        chunkFileNames: 'shared/[name]-[hash].js',
        assetFileNames: '[name][extname]',
        // No code splitting for extension — each entry must be self-contained
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
