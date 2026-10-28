import { LayoutGrid, List } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "@/components/locale-link";
import type { Dictionary } from "@/lib/dictionaries";

export type ListingsView = "grid" | "list";

export function ViewToggle({ view, t }: { view: ListingsView; t: Dictionary }) {
  const options: [ListingsView, string, LucideIcon, string][] = [
    ["grid", "/dashboard/listings", LayoutGrid, t.dashboard.cardView],
    ["list", "/dashboard/listings?view=list", List, t.dashboard.listView],
  ];

  return (
    <div className="inline-flex gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700">
      {options.map(([value, href, Icon, label]) => {
        const active = value === view;
        return (
          <Link
            key={value}
            href={href}
            aria-label={label}
            title={label}
            aria-current={active ? "page" : undefined}
            className={`flex size-9 items-center justify-center rounded-full transition-colors ${
              active
                ? "bg-zinc-900 text-white hover:text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            }`}
          >
            <Icon className="size-4" aria-hidden />
          </Link>
        );
      })}
    </div>
  );
}
