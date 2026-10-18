import { getAdminActions } from "@/lib/admin";
import { ActionList } from "../action-list";
import { pageParam, Pager } from "../pager";
import { Panel } from "../ui";

// Moderation decisions, newest first. Plan changes and featured grants have
// their own history on the Plans page.
export default async function AdminActivityPage({ searchParams }: PageProps<"/admin/activity">) {
  const params = await searchParams;
  const page = pageParam(params);
  const { actions, total } = await getAdminActions(page);

  return (
    <div className="flex flex-col gap-4">
      <Panel
        title={total === 1 ? "1 decision" : `${total.toLocaleString("en-US")} decisions`}
        description="Listing removals, suspensions and verification decisions. Plan changes are on the Plans page."
      >
        <ActionList actions={actions} empty="No moderation actions yet" />
      </Panel>
      <Pager basePath="/admin/activity" params={params} page={page} total={total} />
    </div>
  );
}
