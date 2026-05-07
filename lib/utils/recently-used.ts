const MAX_RECENT = 6;
const STORAGE_KEY = "kit_recent_tools";

export function trackToolUsage(toolId: string): void {
  if (typeof window === "undefined") return;
  try {
    const recent: string[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "[]"
    );
    const updated = [toolId, ...recent.filter((id) => id !== toolId)].slice(
      0,
      MAX_RECENT
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function getRecentToolIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function clearRecentTools(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
