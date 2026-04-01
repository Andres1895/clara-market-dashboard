import { useState } from "react";

const STARRED_ASSETS_KEY = "starred_assets";

function readFromStorage(): Set<string> {
  try {
    const raw = localStorage.getItem(STARRED_ASSETS_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((item): item is string => typeof item === "string"));
  } catch {
    return new Set();
  }
}

export function useStarredAssets() {
  const [starredIds, setStarredIds] = useState<Set<string>>(() => readFromStorage());

  function toggleStar(id: string) {
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem(STARRED_ASSETS_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }

  function isStarred(id: string): boolean {
    return starredIds.has(id);
  }

  return { starredIds, toggleStar, isStarred };
}
