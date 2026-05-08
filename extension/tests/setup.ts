// tests/setup.ts
// Vitest global test setup — mock chrome APIs

global.chrome = {
  storage: {
    local: {
      get: (_key: unknown, cb?: (result: Record<string, unknown>) => void) => {
        cb?.({})
        return Promise.resolve({})
      },
      set: (_data: unknown, cb?: () => void) => {
        cb?.()
        return Promise.resolve()
      },
      remove: (_key: unknown, cb?: () => void) => {
        cb?.()
        return Promise.resolve()
      },
      onChanged: { addListener: () => {}, removeListener: () => {} },
    },
    session: {
      get: (_key: unknown, cb?: (result: Record<string, unknown>) => void) => {
        cb?.({})
        return Promise.resolve({})
      },
      set: (_data: unknown, cb?: () => void) => {
        cb?.()
        return Promise.resolve()
      },
      remove: (_key: unknown, cb?: () => void) => {
        cb?.()
        return Promise.resolve()
      },
    },
  },
  runtime: {
    sendMessage: () => Promise.resolve(),
    onMessage: { addListener: () => {}, removeListener: () => {} },
    getURL: (path: string) => `chrome-extension://test/${path}`,
    getManifest: () => ({ version: '1.0.0' }),
  },
  tabs: {
    create: () => Promise.resolve(),
    query: (_: unknown, cb?: (tabs: unknown[]) => void) => { cb?.([]); return Promise.resolve([]) },
  },
  action: {
    setBadgeText: () => Promise.resolve(),
    setBadgeBackgroundColor: () => Promise.resolve(),
  },
  contextMenus: {
    create: () => {},
    removeAll: () => Promise.resolve(),
  },
} as unknown as typeof chrome
