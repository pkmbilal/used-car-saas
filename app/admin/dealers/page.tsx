import Link from "next/link";
import { getPendingDealerApplications } from "@/lib/admin";
import { DEALER_DOCS, DEALER_PLANS } from "@/lib/dealer-application-options";
import { formatMonthYear } from "@/lib/format";
import { PLAN_LABELS } from "@/lib/plans";
import { approveDealerApplicationAction, rejectDealerApplicationAction } from "../actions";
import { ApproveDealerButton, ReasonActionButton } from "../admin-buttons";

const planOptions = DEALER_PLANS.map((plan) => ({ value: plan, label: PLAN_LABELS[plan] }));

export default async function AdminDealersPage() {
  const applications = await getPendingDealerApplications();

  if (applications.length === 0) {
    return <p className="text-zinc-600 dark:text-zinc-400">No dealer applications waiting.</p>;
  }

  return (
    <>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Check the business details and any documents, and confirm payment before approving.
        Document links expire after 5 minutes — reload for fresh ones.
      </p>
      <ul className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
        {applications.map((application) => (
          <li key={application.id} className="flex flex-wrap items-start gap-4 py-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{application.business_name}</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {application.user ? (
                  <Link href={`/sellers/${application.user.id}`} className="underline">
                    {application.user.full_name ?? "Unnamed"}
                  </Link>
                ) : (
                  "Deleted user"
                )}
                {" · "}
                {[
                  application.user?.phone,
                  application.user?.city,
                  application.user && `Joined ${formatMonthYear(application.user.created_at)}`,
                  `Applied ${new Date(application.created_at).toLocaleDateString("en-GB")}`,
                  `Asked for ${PLAN_LABELS[application.requested_plan]}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                {application.user?.suspended_at && " · Suspended"}
              </p>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="text-zinc-600 dark:text-zinc-400">Showroom</dt>
                <dd>{application.showroom_address ?? "—"}</dd>
                <dt className="text-zinc-600 dark:text-zinc-400">CR number</dt>
                <dd>{application.cr_number ?? "—"}</dd>
                <dt className="text-zinc-600 dark:text-zinc-400">VAT number</dt>
                <dd>{application.vat_number ?? "—"}</dd>
                <dt className="text-zinc-600 dark:text-zinc-400">Muroor number</dt>
                <dd>{application.muroor_number ?? "—"}</dd>
              </dl>
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                {application.docs.length === 0 ? (
                  <span className="text-zinc-600 dark:text-zinc-400">No documents uploaded</span>
                ) : (
                  application.docs.map((doc) => (
                    <a
                      key={doc.doc}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline"
                    >
                      {DEALER_DOCS[doc.doc]}
                      {doc.isPdf ? " (PDF)" : ""}
                    </a>
                  ))
                )}
              </div>
            </div>
            <div className="flex items-start gap-4">
              <ApproveDealerButton
                plan={application.requested_plan}
                plans={planOptions}
                action={approveDealerApplicationAction.bind(null, application.id)}
              />
              <ReasonActionButton
                label="Reject"
                action={rejectDealerApplicationAction.bind(null, application.id)}
              />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
