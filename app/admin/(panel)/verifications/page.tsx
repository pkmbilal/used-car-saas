import Link from "next/link";
import { BadgeCheck, Clock } from "lucide-react";
import { getPendingIdVerifications } from "@/lib/admin";
import { formatDay, formatMonthYear } from "@/lib/format";
import { approveIdVerificationAction, rejectIdVerificationAction } from "../actions";
import { AdminActionButton, ReasonActionButton } from "../admin-buttons";
import { Avatar, DetailGrid, DocumentTile, EmptyState, Hint, linkClass, Panel, Pill } from "../ui";

export default async function AdminVerificationsPage() {
  const requests = await getPendingIdVerifications();

  if (requests.length === 0) {
    return (
      <Panel>
        <EmptyState icon={BadgeCheck} title="No ID checks waiting">
          Sellers who upload an ID for the verified badge show up here.
        </EmptyState>
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Hint icon={Clock}>
        Check that the name on the ID matches the profile. Document links expire after 5 minutes, so reload for fresh
        ones. Files are deleted once you approve or reject.
      </Hint>

      <div className="grid gap-4 xl:grid-cols-2">
        {requests.map((request) => (
          <Panel key={request.id}>
            <div className="flex items-start gap-4">
              <Avatar name={request.user?.full_name ?? null} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {request.user ? (
                    <Link href={`/admin/users/${request.user.id}`} className={`text-lg ${linkClass}`}>
                      {request.user.full_name ?? "Unnamed"}
                    </Link>
                  ) : (
                    <span className="text-lg font-medium">Deleted user</span>
                  )}
                  {request.user?.suspended_at && <Pill tone="red">Suspended</Pill>}
                </div>
                <p className="mt-0.5 text-sm text-zinc-500">Submitted {formatDay(request.created_at)}</p>
              </div>
            </div>

            <div className="mt-5">
              <DetailGrid
                items={[
                  { label: "Phone", value: request.user?.phone },
                  { label: "City", value: request.user?.city },
                  { label: "Member since", value: request.user && formatMonthYear(request.user.created_at) },
                  { label: "Documents", value: request.docs.length },
                ]}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {request.docs.map((doc, index) => (
                <DocumentTile key={doc.url} href={doc.url} label={`ID document ${index + 1}`} isPdf={doc.isPdf} />
              ))}
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-line pt-4 dark:border-zinc-800">
              <ReasonActionButton
                label="Reject"
                title="Reject this ID check?"
                description="The seller sees your reason and can upload new documents."
                success="ID check rejected"
                action={rejectIdVerificationAction.bind(null, request.id)}
              />
              <AdminActionButton
                label="Approve and verify"
                tone="primary"
                success="Seller verified"
                action={approveIdVerificationAction.bind(null, request.id)}
              />
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
