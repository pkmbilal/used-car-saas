"use client";

import { useState } from "react";
import { PlayCircle } from "lucide-react";
import { markTutorialsPromptSeen } from "@/app/[lang]/(seller)/dashboard/tutorials-prompt-actions";
import { useDictionary } from "@/components/i18n-provider";
import Link from "@/components/locale-link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// One-time popup pointing new dealers at the video tutorials. The layout only
// renders it until the seller dismisses it; any close records that.
export function TutorialsPrompt() {
  const { t } = useDictionary();
  const p = t.sellerCenter.tutorialsPrompt;
  const [open, setOpen] = useState(true);

  function dismiss() {
    setOpen(false);
    void markTutorialsPromptSeen();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && dismiss()}>
      <DialogContent className="light sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <span className="grid size-12 place-items-center rounded-full bg-mint text-brand ring-6 ring-mint/40">
            <PlayCircle className="size-6" aria-hidden />
          </span>
          <DialogTitle className="mt-2 text-lg font-semibold">{p.title}</DialogTitle>
          <DialogDescription>{p.body}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
          >
            {p.later}
          </button>
          <Link
            href="/tutorials"
            onClick={dismiss}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-gradient-to-b from-brand to-forest px-5 text-sm font-semibold text-white shadow-sm shadow-forest/25 hover:text-white hover:brightness-110"
          >
            <PlayCircle className="size-4" aria-hidden />
            {p.watch}
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
