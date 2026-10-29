/**
 * Recent searches, kept on this device only. Storage can be unavailable
 * (private mode, blocked site data), so every access is guarded.
 */
const KEY = "lm_recent_searches";
const MAX = 8;

export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string) {
  const q = query.trim();
  if (q.length < 2) return;
  try {
    const next = [q, ...getRecentSearches().filter((s) => s.toLowerCase() !== q.toLowerCase())].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function clearRecentSearches() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
