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

  return (
    <nav className="mt-8 flex items-center justify-center gap-6 text-sm">
      {page > 1 ? (
        <Link href={href(page - 1)} className="font-medium">
          ← Previous
        </Link>
      ) : (
        <span className="text-zinc-400">← Previous</span>
      )}
      <span className="text-zinc-600 dark:text-zinc-400">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={href(page + 1)} className="font-medium">
          Next →
        </Link>
      ) : (
        <span className="text-zinc-400">Next →</span>
      )}
    </nav>
  );
}
