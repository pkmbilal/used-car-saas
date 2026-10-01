"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDownIcon } from "@/components/icons";

const sortLabels = {
  newest: "Newest First",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
} as const;

// Changing the sort keeps the filters but starts again from page 1.
export function SortSelect({ value }: { value: keyof typeof sortLabels }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function change(sort: string) {
    const params = new URLSearchParams(searchParams);
    params.delete("page");
    if (sort === "newest") params.delete("sort");
    else params.set("sort", sort);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <label className="flex items-center gap-3 text-[11px] text-ink/70">
      Sort by
      <span className="relative flex items-center">
        <select
          value={value}
          onChange={(event) => change(event.target.value)}
          className="h-8 appearance-none rounded-md border border-line bg-white pr-8 pl-2.5 text-xs text-ink outline-none focus:border-brand"
        >
          {Object.entries(sortLabels).map(([sort, label]) => (
            <option key={sort} value={sort}>
              {label}
            </option>
          ))}
        </select>
        <ChevronDownIcon size={11} strokeWidth={2.4} className="pointer-events-none absolute right-2.5" />
      </span>
    </label>
  );
}
