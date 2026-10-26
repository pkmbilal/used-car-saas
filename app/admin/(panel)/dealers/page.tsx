import Link from "next/link";
import { Clock, Store } from "lucide-react";
import { getPendingDealerApplications } from "@/lib/admin";
import { DEALER_DOCS, DEALER_PLANS } from "@/lib/dealer-application-options";
import { formatDay, formatMonthYear } from "@/lib/format";
import { PLAN_DURATION_OPTIONS, PLAN_LABELS } from "@/lib/plans";
import { approveDealerApplicationAction, rejectDealerApplicationAction } from "../actions";
import { ApproveDealerButton, ReasonActionButton } from "../admin-buttons";
import { DetailGrid, DocumentTile, EmptyState, Hint, linkClass, muted, Panel, Pill } from "../ui";

const planOptions = DEALER_PLANS.map((plan) => ({ value: plan, label: PLAN_LABELS[plan] }));

export default async function AdminDealersPage() {
  const applications = await getPendingDealerApplications();

  if (applications.length === 0) {
    return (
      <Panel>
        <EmptyState icon={Store} title="No dealer applications waiting">
          Businesses that apply for a dealer plan show up here.
        </EmptyState>
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Hint icon={Clock}>
        Check the business details and documents, and confirm payment before approving. Document links expire after 5
        minutes, so reload for fresh ones.
      </Hint>

      {applications.map((application) => (
        <Panel key={application.id} flush>
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line bg-gradient-to-r from-mint/70 to-transparent px-5 py-4 dark:border-zinc-800 dark:from-zinc-800/60">
            <div className="flex items-center gap-4">
              <span className="grid size-12 place-items-center rounded-lg bg-forest text-lime">
                <Store className="size-6" aria-hidden />
              </span>
              <div>
                <p className="text-lg font-semibold">{application.business_name}</p>
                <p className={`text-sm ${muted}`}>
                  Applied by{" "}
                  {application.user ? (
                    <Link href={`/admin/users/${application.user.id}`} className={linkClass}>
                      {application.user.full_name ?? "Unnamed"}
                    </Link>
                  ) : (
                    "a deleted user"
                  )}{" "}
                  on {formatDay(application.created_at, "en")}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill tone="brand">Wants {PLAN_LABELS[application.requested_plan]}</Pill>
              {application.user?.suspended_at && <Pill tone="red">Suspended</Pill>}
            </div>
          </div>

          <div className="grid gap-6 p-5 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold">Business</h3>
              <div className="mt-3">
                <DetailGrid
                  items={[
                    { label: "Showroom", value: application.showroom_address },
                    { label: "CR number", value: application.cr_number },
                    { label: "VAT number", value: application.vat_number },
                    { label: "Muroor number", value: application.muroor_number },
                  ]}
                />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Applicant</h3>
              <div className="mt-3">
                <DetailGrid
                  items={[
                    { label: "Phone", value: application.user?.phone },
                    { label: "City", value: application.user?.city },
                    {
                      label: "Member since",
                      value: application.user && formatMonthYear(application.user.created_at, "en"),
                    },
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="px-5 pb-5">
            <h3 className="text-sm font-semibold">Documents</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {application.docs.length === 0 ? (
                <p className={`text-sm ${muted}`}>No documents uploaded.</p>
              ) : (
                application.docs.map((doc) => (
                  <DocumentTile key={doc.doc} href={doc.url} label={DEALER_DOCS[doc.doc]} isPdf={doc.isPdf} />
                ))
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-line bg-canvas/50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-800/30">
            <ApproveDealerButton
              plan={application.requested_plan}
              plans={planOptions}
              durations={PLAN_DURATION_OPTIONS}
              action={approveDealerApplicationAction.bind(null, application.id)}
            />
            <ReasonActionButton
              label="Reject"
              title="Reject this application?"
              description="The applicant sees your reason and can apply again."
              success="Application rejected"
              action={rejectDealerApplicationAction.bind(null, application.id)}
            />
          </div>
        </Panel>
      ))}
    </div>
  );
}
