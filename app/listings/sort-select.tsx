"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    <div className="flex items-center gap-3">
      <Label htmlFor="sort" className="text-[0.6875rem] font-normal text-ink/70">
        Sort by
      </Label>
      <Select value={value} onValueChange={change}>
        <SelectTrigger id="sort" className="h-8 min-w-40 bg-white text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end" className="light">
          {Object.entries(sortLabels).map(([sort, label]) => (
            <SelectItem key={sort} value={sort}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
