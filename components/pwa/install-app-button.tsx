"use client";

import { useEffect, useState } from "react";
import { Download, Share, SquarePlus } from "lucide-react";
import { useDictionary } from "@/components/i18n-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Chrome/Edge fire this before showing their own install UI; not in lib.dom yet.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Mode = "hidden" | "prompt" | "ios";

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// iPhone/iPad Safari has no install prompt; users add it from the Share menu.
function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

// "Install app": the browser's install prompt where there is one, and
// Add-to-Home-Screen steps on iOS. Hidden once installed or when unsupported.
export function InstallAppButton({ className }: { className?: string }) {
  const { t } = useDictionary();
  const [mode, setMode] = useState<Mode>("hidden");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosOpen, setIosOpen] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    // Deferred so the state update doesn't run synchronously inside the effect.
    if (isIosSafari()) queueMicrotask(() => setMode("ios"));

    function onPrompt(event: Event) {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setMode("prompt");
    }
    function onInstalled() {
      setDeferred(null);
      setMode("hidden");
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (mode === "hidden") return null;

  async function install() {
    if (mode === "ios") {
      setIosOpen(true);
      return;
    }
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    // The event can only be used once.
    setDeferred(null);
    if (outcome === "accepted") setMode("hidden");
  }

  return (
    <>
      <button type="button" onClick={install} className={className}>
        <Download className="size-4 shrink-0" aria-hidden />
        {t.pwa.install}
      </button>
      {mode === "ios" && (
        <Dialog open={iosOpen} onOpenChange={setIosOpen}>
          <DialogContent className="light sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t.pwa.iosTitle}</DialogTitle>
              <DialogDescription>{t.pwa.iosIntro}</DialogDescription>
            </DialogHeader>
            <ol className="flex flex-col gap-3 text-sm">
              <li className="flex items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-canvas text-brand ring-1 ring-line">
                  <Share className="size-4" aria-hidden />
                </span>
                {t.pwa.iosStepShare}
              </li>
              <li className="flex items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-canvas text-brand ring-1 ring-line">
                  <SquarePlus className="size-4" aria-hidden />
                </span>
                {t.pwa.iosStepAdd}
              </li>
            </ol>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
