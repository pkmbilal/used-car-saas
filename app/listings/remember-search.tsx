"use client";

import { useEffect } from "react";

export const LAST_SEARCH_KEY = "lastSearch";

// Remembers the current browse URL so a listing's "Back to Search" can return to it.
export function RememberSearch({ href }: { href: string }) {
  useEffect(() => {
    try {
      sessionStorage.setItem(LAST_SEARCH_KEY, href);
    } catch {
      // Storage unavailable: Back to Search falls back to /listings.
    }
  }, [href]);

  return null;
}
