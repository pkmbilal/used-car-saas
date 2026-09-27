"use client";

import { useOptimistic, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toggleFavorite } from "@/app/favorites/actions";

type Props = {
  listingId: string;
  favorited: boolean;
  // "icon" floats over a listing card photo; "label" sits beside a title.
  variant?: "icon" | "label";
  className?: string;
};

export function FavoriteButton({ listingId, favorited, variant = "icon", className = "" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [saved, setSaved] = useState(favorited);
  const [optimistic, setOptimistic] = useOptimistic(saved);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function toggle() {
    const next = !optimistic;
    setError(undefined);
    startTransition(async () => {
      setOptimistic(next);
      const result = await toggleFavorite(listingId, next);
      if (result.error === "signin") {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
      } else if (result.error) {
        setError(result.error);
      } else {
        setSaved(next);
      }
    });
  }

  const label = optimistic ? "Remove from saved cars" : "Save this car";
  const heart = (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-5 w-5 ${optimistic ? "fill-red-500 stroke-red-500" : "fill-none stroke-current"}`}
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.2 5 6.8 5c2 0 3.4 1.1 4.2 2.4h2C13.8 6.1 15.2 5 17.2 5c3.6 0 5.6 3.6 4.3 6.8C19.5 16.4 12 21 12 21z"
      />
    </svg>
  );

  if (variant === "label") {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          aria-pressed={optimistic}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium dark:border-zinc-700"
        >
          {heart}
          {optimistic ? "Saved" : "Save"}
        </button>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={optimistic}
      aria-label={label}
      title={error ?? label}
      className={`rounded-full bg-white/90 p-2 text-zinc-700 shadow-sm backdrop-blur hover:bg-white dark:bg-zinc-900/90 dark:text-zinc-200 ${className}`}
    >
      {heart}
    </button>
  );
}
