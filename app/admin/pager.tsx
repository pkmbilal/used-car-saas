import Link from "next/link";
import { ADMIN_PAGE_SIZE } from "@/lib/admin";

type SearchParams = Record<string, string | string[] | undefined>;

export function pageParam(params: SearchParams): number {
  const page = Number(params.page);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function textParam(params: SearchParams, key: string): string | undefined {
  const value = params[key];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

// Previous/next links that keep the current search params.
export function Pager({
  basePath,
  params,
  page,
  total,
}: {
  basePath: string;
  params: SearchParams;
  page: number;
  total: number;
}) {
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  if (pageCount <= 1) return null;

  function href(target: number) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string" && value !== "" && key !== "page") query.set(key, value);
    }
    if (target > 1) query.set("page", String(target));
    const search = query.toString();
    return search ? `${basePath}?${search}` : basePath;
  }

  const from = (page - 1) * ADMIN_PAGE_SIZE + 1;
  const to = Math.min(page * ADMIN_PAGE_SIZE, total);
  const button =
    "inline-flex h-8 items-center rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-900";

  return (
    <nav className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="text-zinc-600 dark:text-zinc-400">
        Showing {from}–{to} of {total} · Page {page} of {pageCount}
      </span>
      <span className="flex gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className={`${button} hover:bg-canvas dark:hover:bg-zinc-800`}>
            Previous
          </Link>
        ) : (
          <span className={`${button} opacity-40`}>Previous</span>
        )}
        {page < pageCount ? (
          <Link href={href(page + 1)} className={`${button} hover:bg-canvas dark:hover:bg-zinc-800`}>
            Next
          </Link>
        ) : (
          <span className={`${button} opacity-40`}>Next</span>
        )}
      </span>
    </nav>
  );
}
