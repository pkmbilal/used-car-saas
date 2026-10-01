"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Native share sheet where available (mobile), otherwise copy the link.
export function ShareButton({ title }: { title: string }) {
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
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  }

  return (
    <Button type="button" variant="outline" onClick={share} className="h-10 w-full bg-white text-xs font-medium">
      <Share2 className="size-3.5" />
      Share
    </Button>
  );
}
