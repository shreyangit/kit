import { useState, useEffect } from 'react'

export function useStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => Promise<void>] {
  const [value, setValue] = useState<T>(defaultValue)

  useEffect(() => {
    // Load initial value
    chrome.storage.local.get(key, (result) => {
      if (result[key] !== undefined) {
        setValue(result[key] as T)
      }
    })

    // React to changes from service worker or other popup instances
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (Object.prototype.hasOwnProperty.call(changes, key)) {
        setValue((changes[key].newValue ?? defaultValue) as T)
      }
    }
    chrome.storage.local.onChanged.addListener(listener)
    return () => chrome.storage.local.onChanged.removeListener(listener)
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = async (newValue: T) => {
    setValue(newValue)
    await chrome.storage.local.set({ [key]: newValue })
  }

  return [value, set]
}
