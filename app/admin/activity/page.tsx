import { getAdminActions } from "@/lib/admin";
import { ActionList } from "../action-list";
import { pageParam, Pager } from "../pager";

// Moderation decisions, newest first. Plan changes and featured grants have
// their own history on the Plans page.
export default async function AdminActivityPage({ searchParams }: PageProps<"/admin/activity">) {
  const params = await searchParams;
  const page = pageParam(params);
  const { actions, total } = await getAdminActions(page);

  return (
    <>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Listing removals, suspensions and verification decisions. Plan changes are on the Plans page.
      </p>
      <ActionList actions={actions} empty="No moderation actions yet." />
      <Pager basePath="/admin/activity" params={params} page={page} total={total} />
    </>
  );
}
