import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

// Page numbers to show: first, last, and a window around the current page.
function pageItems(page: number, pageCount: number): (number | "gap")[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (page >= pageCount - 2) [pageCount - 3, pageCount - 2, pageCount - 1].forEach((p) => pages.add(p));

  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ["gap" as const, p] : [p]));
}

const itemClass =
  "flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-semibold shadow-[0_1px_3px_rgba(0,0,0,.06)]";

export function Pagination({
  page,
  pageCount,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap justify-center gap-2">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} aria-label="Previous page" className={`${itemClass} bg-white text-ink`}>
          <ChevronLeftIcon size={14} />
        </Link>
      ) : (
        <span className={`${itemClass} bg-white text-ink/30`} aria-hidden>
          <ChevronLeftIcon size={14} />
        </span>
      )}
      {pageItems(page, pageCount).map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} className={`${itemClass} text-muted shadow-none`}>
            …
          </span>
        ) : (
          <Link
            key={item}
            href={hrefFor(item)}
            aria-current={item === page ? "page" : undefined}
            className={`${itemClass} ${item === page ? "bg-brand text-white hover:text-white" : "bg-white text-ink"}`}
          >
            {item}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} aria-label="Next page" className={`${itemClass} bg-white text-ink`}>
          <ChevronRightIcon size={14} />
        </Link>
      ) : (
        <span className={`${itemClass} bg-white text-ink/30`} aria-hidden>
          <ChevronRightIcon size={14} />
        </span>
      )}
    </nav>
  );
}
