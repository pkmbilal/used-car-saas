import {
  Pagination as PaginationRoot,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Page numbers to show: first, last, and a window around the current page.
function pageItems(page: number, pageCount: number): (number | "gap")[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (page >= pageCount - 2) [pageCount - 3, pageCount - 2, pageCount - 1].forEach((p) => pages.add(p));

  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ["gap" as const, p] : [p]));
}

const disabled = "pointer-events-none opacity-40";

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
    <PaginationRoot className="mt-8">
      <PaginationContent className="flex-wrap justify-center">
        <PaginationItem>
          <PaginationPrevious
            href={hrefFor(Math.max(1, page - 1))}
            aria-disabled={page === 1}
            tabIndex={page === 1 ? -1 : undefined}
            className={page === 1 ? disabled : undefined}
          />
        </PaginationItem>
        {pageItems(page, pageCount).map((item, i) => (
          <PaginationItem key={item === "gap" ? `gap-${i}` : item}>
            {item === "gap" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                href={hrefFor(item)}
                isActive={item === page}
                className={
                  item === page
                    ? "border-brand bg-brand text-white hover:bg-brand-dark hover:text-white"
                    : "bg-white"
                }
              >
                {item}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href={hrefFor(Math.min(pageCount, page + 1))}
            aria-disabled={page === pageCount}
            tabIndex={page === pageCount ? -1 : undefined}
            className={page === pageCount ? disabled : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </PaginationRoot>
  );
}
