import Link from "next/link";
import { Clock, PackagePlus, PlusCircle, Sparkles } from "lucide-react";
import { addonReference } from "@/lib/addons";
import { getPendingAddonRequests } from "@/lib/admin";
import { formatDay } from "@/lib/format";
import { addonPriceWithVat, BOOST_DAYS, PLAN_LABELS } from "@/lib/plans";
import { approveAddonRequestAction, rejectAddonRequestAction } from "../actions";
import { ApproveAddonButton, ReasonActionButton } from "../admin-buttons";
import { EmptyState, Hint, linkClass, muted, Panel, Pill } from "../ui";

export default async function AdminRequestsPage() {
  const requests = await getPendingAddonRequests();

  if (requests.length === 0) {
    return (
      <Panel>
        <EmptyState icon={PackagePlus} title="No add-on requests waiting">
          Sellers who ask for a featured boost or extra listings show up here.
        </EmptyState>
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Hint icon={Clock}>
        Contact the seller about payment and confirm it before approving. Sellers quote the reference shown on each
        request.
      </Hint>

      {requests.map((request) => {
        const isBoost = request.kind === "featured_boost";
        const Icon = isBoost ? Sparkles : PlusCircle;
        const price = addonPriceWithVat(request.kind, request.quantity);

        return (
          <Panel key={request.id} flush>
            <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
              <div className="flex items-center gap-4">
                <span className="grid size-12 place-items-center rounded-lg bg-forest text-lime">
                  <Icon className="size-6" aria-hidden />
                </span>
                <div>
                  <p className="text-lg font-semibold">
                    {isBoost
                      ? `Featured boost · ${BOOST_DAYS} days`
                      : `${request.quantity} extra listing${request.quantity === 1 ? "" : "s"}`}
                  </p>
                  <p className={`text-sm ${muted}`}>
                    Requested by{" "}
                    {request.user ? (
                      <Link href={`/admin/users/${request.user.id}`} className={linkClass}>
                        {request.user.full_name ?? "Unnamed"}
                      </Link>
                    ) : (
                      "a deleted user"
                    )}{" "}
                    on {formatDay(request.created_at, "en")}
                    {request.user?.phone && ` · ${request.user.phone}`}
                  </p>
                  {isBoost && request.listing && (
                    <p className={`mt-0.5 text-sm ${muted}`}>
                      Listing:{" "}
                      <Link href={`/en/listings/${request.listing.id}`} className={linkClass}>
                        {request.listing.year} {request.listing.make} {request.listing.model}
                      </Link>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Pill tone="brand">Ref. {addonReference(request.id)}</Pill>
                <Pill>SAR {price.toFixed(2)} incl. VAT</Pill>
                {request.user && <Pill>{PLAN_LABELS[request.user.plan]}</Pill>}
                {request.user?.suspended_at && <Pill tone="red">Suspended</Pill>}
                {isBoost && request.listing && request.listing.status !== "active" && (
                  <Pill tone="red">Listing not live</Pill>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line bg-canvas/50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-800/30">
              <ReasonActionButton
                label="Reject"
                title="Reject this request?"
                description="The reason is kept in the activity log. Let the seller know yourself."
                success="Request rejected"
                action={rejectAddonRequestAction.bind(null, request.id)}
              />
              <ApproveAddonButton price={price} action={approveAddonRequestAction.bind(null, request.id)} />
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
