"use client";

import { useId, useMemo, useRef, useState } from "react";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react";
import { Popover } from "radix-ui";
import { cn } from "@/lib/utils";

export type SearchableOption = { value: string; label: string };

// Trigger look for the browse filters and search bars (matches the shadcn Select trigger).
export const filterTriggerClass =
  "h-9 w-full rounded-lg border border-input bg-white px-2.5 text-xs whitespace-nowrap transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-[size=default]:h-9 max-sm:text-sm max-sm:data-[size=default]:h-10 dark:bg-input/30";

const normalize = (text: string) => text.trim().toLowerCase();

// A dropdown with a search box at the top that filters the options as you
// type (matching both the label and the stored value, so English and Arabic
// names both work). When `name` is set it submits with a plain form.
export function SearchableSelect({
  id,
  name,
  value,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  required,
  disabled,
  customOption,
  icon,
  triggerClassName,
  contentClassName,
}: {
  id?: string;
  name?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SearchableOption[];
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  required?: boolean;
  disabled?: boolean;
  // Label for a "use what I typed" row, or undefined to hide it.
  customOption?: (query: string) => string | undefined;
  // Shown in the trigger before the selected label.
  icon?: React.ReactNode;
  triggerClassName?: string;
  contentClassName?: string;
}) {
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const items = useMemo(() => {
    const q = normalize(query);
    const matches = q
      ? options.filter((option) => normalize(option.label).includes(q) || normalize(option.value).includes(q))
      : [...options];
    const exact = matches.some((option) => normalize(option.label) === q || normalize(option.value) === q);
    const customLabel = q && !exact ? customOption?.(query.trim()) : undefined;
    return customLabel ? [...matches, { value: query.trim(), label: customLabel, custom: true }] : matches;
  }, [options, query, customOption]);

  const selected = options.find((option) => option.value === value);
  const display = selected?.label ?? (value || placeholder);

  function choose(next: string) {
    onValueChange(next);
    setOpen(false);
  }

  function move(delta: number) {
    if (items.length === 0) return;
    const next = (active + delta + items.length) % items.length;
    setActive(next);
    listRef.current?.querySelector<HTMLElement>(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" });
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setQuery("");
        if (next) setActive(Math.max(0, options.findIndex((option) => option.value === value)));
      }}
    >
      {/* Only positioned when it holds the validation input, so a trigger can
          still stretch an ::after over its parent cell. */}
      <div className={required ? "relative" : "contents"}>
        <Popover.Trigger asChild disabled={disabled}>
          <button
            ref={triggerRef}
            id={id}
            type="button"
            data-size="default"
            className={cn(
              "flex items-center justify-between gap-2 text-start disabled:cursor-not-allowed disabled:opacity-60",
              triggerClassName,
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              {icon}
              <span className={cn("truncate", !value && "text-zinc-500 dark:text-zinc-400")}>{display}</span>
            </span>
            <ChevronDownIcon className="size-4 shrink-0 opacity-50" aria-hidden />
          </button>
        </Popover.Trigger>
        {name && required && (
          // A real input so the form submits the value and the browser's
          // "required" check points at the trigger.
          <input
            tabIndex={-1}
            aria-hidden
            name={name}
            required={required}
            value={value}
            onChange={() => {}}
            onFocus={() => triggerRef.current?.focus()}
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-0"
          />
        )}
      </div>
      {name && !required && value && <input type="hidden" name={name} value={value} />}
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className={cn(
            "light z-50 flex w-(--radix-popover-trigger-width) min-w-48 flex-col overflow-hidden rounded-xl border border-line bg-white text-sm text-zinc-900 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100",
            contentClassName,
          )}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            (event.currentTarget as HTMLElement).querySelector("input")?.focus();
          }}
        >
          <div className="flex items-center gap-2 border-b border-line px-3 dark:border-zinc-700">
            <SearchIcon className="size-4 shrink-0 text-zinc-400" aria-hidden />
            <input
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-activedescendant={items[active] ? `${listId}-${active}` : undefined}
              value={query}
              placeholder={searchPlaceholder}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  move(1);
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  move(-1);
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  const item = items[active];
                  if (item) choose(item.value);
                }
              }}
              className="h-10 w-full bg-transparent text-base outline-none placeholder:text-zinc-400 sm:text-sm"
            />
          </div>
          <div ref={listRef} id={listId} role="listbox" className="max-h-64 overflow-y-auto p-1">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-zinc-500">{emptyText}</p>
            ) : (
              items.map((item, index) => {
                const isSelected = !("custom" in item) && item.value === value;
                return (
                  <div
                    key={`${"custom" in item ? "custom:" : ""}${item.value}`}
                    id={`${listId}-${index}`}
                    data-index={index}
                    role="option"
                    aria-selected={isSelected}
                    onPointerMove={() => setActive(index)}
                    onClick={() => choose(item.value)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 select-none",
                      index === active && "bg-zinc-100 dark:bg-zinc-800",
                      "custom" in item && "font-medium text-brand dark:text-lime",
                    )}
                  >
                    <span className="truncate">{item.label}</span>
                    {isSelected && <CheckIcon className="size-4 shrink-0" aria-hidden />}
                  </div>
                );
              })
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
