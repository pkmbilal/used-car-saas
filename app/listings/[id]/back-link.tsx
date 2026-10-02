"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ArrowLeft } from "lucide-react";
import { LAST_SEARCH_KEY } from "../remember-search";

function lastSearch(): string {
  try {
    const href = sessionStorage.getItem(LAST_SEARCH_KEY);
    // Only ever our own browse page.
    return href?.startsWith("/listings") ? href : "/listings";
  } catch {
    return "/listings";
  }
}

const subscribe = () => () => {};

// Back to the search the buyer last ran in this tab, filters and page intact.
export function BackLink() {
  const href = useSyncExternalStore(subscribe, lastSearch, () => "/listings");

  return (
    <Link href={href} className="inline-flex items-center gap-2 text-xs font-medium text-white hover:text-lime">
      <ArrowLeft className="size-3" strokeWidth={2.4} />
      Back to Search
    </Link>
  );
}
