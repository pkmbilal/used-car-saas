"use client";

import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Shared pieces for the ⋯ menus on admin table rows (users, listings).

const STATUS_TONES = {
  green: "bg-green-500",
  red: "bg-red-500",
  brand: "bg-brand dark:bg-lime",
  zinc: "bg-zinc-400",
} as const;

// A dot and a word for the menu header, e.g. "• Active".
export function Status({ tone, children }: { tone: keyof typeof STATUS_TONES; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
      <span aria-hidden className={`size-1.5 rounded-full ${STATUS_TONES[tone]}`} />
      {children}
    </span>
  );
}

export function RowMenuTrigger({ label, disabled }: { label: string; disabled?: boolean }) {
  return (
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={disabled}
        aria-label={label}
        className="rounded-full text-zinc-500 hover:bg-mint hover:text-forest aria-expanded:bg-mint aria-expanded:text-forest aria-expanded:ring-1 aria-expanded:ring-brand/20 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-lime dark:aria-expanded:bg-zinc-800 dark:aria-expanded:text-lime dark:aria-expanded:ring-zinc-700"
      >
        <MoreHorizontal />
      </Button>
    </DropdownMenuTrigger>
  );
}

export function RowMenuContent({ children }: { children: React.ReactNode }) {
  return (
    <DropdownMenuContent
      align="end"
      sideOffset={8}
      className="w-64 rounded-xl border border-line bg-white p-1.5 shadow-[0_16px_40px_-12px_rgba(21,32,26,0.22),0_2px_6px_rgba(21,32,26,0.06)] ring-0 [--accent-foreground:var(--color-ink)] [--accent:var(--color-mint)] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)] dark:[--accent-foreground:var(--color-zinc-50)] dark:[--accent:var(--color-zinc-800)]"
    >
      {children}
    </DropdownMenuContent>
  );
}

// "MANAGE …" eyebrow on the left, status dots on the right.
export function RowMenuHeader({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <DropdownMenuLabel className="flex items-center justify-between gap-2 px-2 pt-1.5 pb-2">
        <span className="text-eyebrow font-semibold tracking-[0.16em] text-zinc-500 uppercase">{title}</span>
        <span className="flex items-center gap-1.5">{children}</span>
      </DropdownMenuLabel>
      <DropdownMenuSeparator className="mx-0 my-1 bg-line dark:bg-zinc-800" />
    </>
  );
}

export function DangerZone() {
  return (
    <>
      <DropdownMenuSeparator className="mx-0 my-1.5 bg-line dark:bg-zinc-800" />
      <DropdownMenuLabel className="px-2 pt-0.5 pb-1 text-eyebrow font-semibold tracking-[0.16em] text-red-600/80 uppercase dark:text-red-400/80">
        Danger zone
      </DropdownMenuLabel>
    </>
  );
}

// One menu item: an icon tile, a title and a short hint underneath. The item's
// focus style recolours every descendant, hence the `!` on the focus colours.
export function MenuRow({
  icon: Icon,
  title,
  hint,
  danger = false,
  onSelect,
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
  danger?: boolean;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem
      variant={danger ? "destructive" : "default"}
      onSelect={onSelect}
      className="cursor-pointer gap-3 rounded-lg px-2 py-2 transition-colors"
    >
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-lg ring-1 transition-colors ${
          danger
            ? "bg-red-50 text-red-600 ring-red-100 dark:bg-red-950/60 dark:text-red-400 dark:ring-red-900/60"
            : "bg-canvas text-forest ring-line group-focus/dropdown-menu-item:bg-white! group-focus/dropdown-menu-item:text-brand! group-focus/dropdown-menu-item:ring-brand/20 dark:bg-zinc-800 dark:text-lime dark:ring-zinc-700 dark:group-focus/dropdown-menu-item:bg-zinc-900! dark:group-focus/dropdown-menu-item:text-lime!"
        }`}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{title}</span>
        <span
          className={`block truncate text-xs ${
            danger
              ? "text-red-600/70 dark:text-red-400/70"
              : "text-zinc-500 group-focus/dropdown-menu-item:text-zinc-600! dark:text-zinc-400 dark:group-focus/dropdown-menu-item:text-zinc-400!"
          }`}
        >
          {hint}
        </span>
      </span>
    </DropdownMenuItem>
  );
}
