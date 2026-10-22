"use client";

import { useEffect } from "react";
import "./globals.css";

// Replaces the root layout when it fails, so it renders its own document.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="light flex min-h-screen flex-col items-center justify-center bg-canvas px-4 text-center font-sans text-ink">
        <title>Something went wrong | KarSouq</title>
        <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          KarSouq is having trouble right now. Try again in a moment.
        </p>
        {error.digest && <p className="mt-2 text-caption text-muted-foreground">Reference: {error.digest}</p>}
        <button
          type="button"
          onClick={() => retry()}
          className="mt-6 h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
