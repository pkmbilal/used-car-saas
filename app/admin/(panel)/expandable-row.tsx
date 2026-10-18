"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { table } from "./ui";

// An admin table row that, as a phone card, starts compact: cells marked
// table.tdDetail stay hidden until the chevron is tapped. Desktop rows are
// unchanged.
export function ExpandableRow({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <tr className={cn(table.row, "group/row")} data-expanded={open || undefined}>
      {children}
      <td className="md:hidden max-md:absolute max-md:top-3 max-md:right-12">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? "Hide details" : "Show details"}
          className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <ChevronDown className={`size-5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        </button>
      </td>
    </tr>
  );
}
