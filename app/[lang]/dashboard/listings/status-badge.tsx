import { getDictionary } from "@/lib/i18n-server";
import type { ListingStatus } from "@/lib/listings";

const styles: Record<ListingStatus, string> = {
  draft: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  active: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  sold: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  removed: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

// Also used by the admin panel, which gets the English labels.
export async function StatusBadge({ status }: { status: ListingStatus }) {
  const { t } = await getDictionary();
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {t.dashboard.status[status]}
    </span>
  );
}
