"use client";

import { useState } from "react";
import { ShareIcon } from "@/components/icons";

// Native share sheet where available (mobile), otherwise copy the link.
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // Dismissed by the user.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked; nothing useful to show.
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-line bg-white px-3 text-xs font-medium text-ink hover:border-brand"
    >
      <ShareIcon size={14} />
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
