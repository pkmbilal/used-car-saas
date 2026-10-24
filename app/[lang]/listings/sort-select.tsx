"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDictionary } from "@/components/i18n-provider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ListingSort = "newest" | "price_asc" | "price_desc" | "mileage_asc" | "year_desc";

// Changing the sort keeps the filters but starts again from page 1. The first
// option is the default and is left out of the URL.
// Without options it offers the listing sorts.
export function SortSelect<T extends string = ListingSort>({
  value,
  options: givenOptions,
}: {
  value: T;
  options?: Record<T, string>;
}) {
  const { t } = useDictionary();
  const options = givenOptions ?? (t.listings.sort as Record<T, string>);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const defaultSort = Object.keys(options)[0];

  function change(sort: string) {
    const params = new URLSearchParams(searchParams);
    params.delete("page");
    if (sort === defaultSort) params.delete("sort");
    else params.set("sort", sort);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex items-center gap-3">
      <Label htmlFor="sort" className="text-caption font-normal text-ink/70">
        {t.listings.sortBy}
      </Label>
      <Select value={value} onValueChange={change}>
        <SelectTrigger id="sort" className="h-8 min-w-40 bg-white text-xs max-sm:h-10 max-sm:text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end" className="light">
          {Object.entries<string>(options).map(([sort, label]) => (
            <SelectItem key={sort} value={sort}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
