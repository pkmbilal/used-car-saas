"use client";

import { Direction } from "radix-ui";

// Radix primitives (Select, DropdownMenu, …) default to LTR unless told
// otherwise, which leaves their layout and keyboard handling unmirrored on
// Arabic pages.
export function DirectionProvider({ dir, children }: { dir: "rtl" | "ltr"; children: React.ReactNode }) {
  return <Direction.DirectionProvider dir={dir}>{children}</Direction.DirectionProvider>;
}
