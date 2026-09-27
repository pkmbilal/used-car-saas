import type { ListingStatus } from "@/lib/listings";

const styles: Record<ListingStatus, string> = {
  draft: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  active: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  sold: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
};

const labels: Record<ListingStatus, string> = {
  draft: "Draft",
  active: "Live",
  sold: "Sold",
};

export function StatusBadge({ status }: { status: ListingStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
