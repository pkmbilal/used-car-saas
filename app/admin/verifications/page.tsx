import Link from "next/link";
import { getPendingIdVerifications } from "@/lib/admin";
import { formatMonthYear } from "@/lib/format";
import { approveIdVerificationAction, rejectIdVerificationAction } from "../actions";
import { AdminActionButton, ReasonActionButton } from "../admin-buttons";

export default async function AdminVerificationsPage() {
  const requests = await getPendingIdVerifications();

  if (requests.length === 0) {
    return <p className="text-zinc-600 dark:text-zinc-400">No ID verifications waiting.</p>;
  }

  return (
    <>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Check the name on the ID matches the profile. Document links expire after 5 minutes —
        reload for fresh ones. Files are deleted once you approve or reject.
      </p>
      <ul className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
        {requests.map((request) => (
          <li key={request.id} className="flex flex-wrap items-start gap-4 py-4">
            <div className="min-w-0 flex-1">
              {request.user ? (
                <Link href={`/sellers/${request.user.id}`} className="font-medium">
                  {request.user.full_name ?? "Unnamed"}
                </Link>
              ) : (
                <span className="font-medium">Deleted user</span>
              )}
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {[
                  request.user?.phone,
                  request.user?.city,
                  request.user && `Joined ${formatMonthYear(request.user.created_at)}`,
                  `Submitted ${new Date(request.created_at).toLocaleDateString("en-GB")}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                {request.user?.suspended_at && " · Suspended"}
              </p>
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                {request.docs.map((doc, index) => (
                  <a
                    key={doc.url}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline"
                  >
                    Document {index + 1}
                    {doc.isPdf ? " (PDF)" : ""}
                  </a>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <AdminActionButton
                label="Approve"
                action={approveIdVerificationAction.bind(null, request.id)}
              />
              <ReasonActionButton
                label="Reject"
                action={rejectIdVerificationAction.bind(null, request.id)}
              />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
