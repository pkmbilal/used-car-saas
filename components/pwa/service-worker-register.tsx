"use client";

import { useEffect } from "react";

// Registers public/sw.js. Production only, so the dev server and HMR never
// run behind a service worker.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // Not installable without it, but the site works fine.
    });
  }, []);
  return null;
}
