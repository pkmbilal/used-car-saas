"use client";

import { useOptimistic, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/app/favorites/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const heart = <Heart className={optimistic ? "size-4 fill-brand stroke-brand" : "size-4"} />;

  if (variant === "label") {
    return (
      <div className={className}>
        <Button
          type="button"
          variant="outline"
          onClick={toggle}
          disabled={pending}
          aria-pressed={optimistic}
          className="h-10 w-full bg-white text-xs font-medium"
        >
          {heart}
          {optimistic ? "Saved" : "Save"}
        </Button>
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      onClick={toggle}
      disabled={pending}
      aria-pressed={optimistic}
      aria-label={label}
      title={error ?? label}
      className={cn("size-9 rounded-full bg-white/90 text-ink shadow-sm backdrop-blur hover:bg-white", className)}
    >
      {heart}
    </Button>
  );
}
