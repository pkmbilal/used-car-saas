"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, RotateCcw, Star, StarOff, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import type { AdminResult } from "@/lib/admin";
import type { ListingStatus } from "@/lib/listings";
import {
  featureListingAction,
  removeListingAction,
  restoreListingAction,
  unfeatureListingAction,
} from "./actions";
import { DangerZone, MenuRow, RowMenuContent, RowMenuHeader, RowMenuTrigger, Status } from "./row-menu";
import { dangerButtonClass, secondaryButtonClass } from "./ui";

// Feature durations offered here; mirrors FEATURE_DAYS in lib/admin.
const FEATURE_OPTIONS = [7, 30];

const STATUS_LABELS = {
  active: { tone: "green", label: "Live" },
  removed: { tone: "red", label: "Removed" },
  sold: { tone: "zinc", label: "Sold" },
  draft: { tone: "zinc", label: "Draft" },
} as const satisfies Record<ListingStatus, { tone: string; label: string }>;

// The ⋯ menu on a dashboard listing row: open it, feature it, take it down.
export function ListingRowActions({
  listingId,
  sellerId,
  status,
  featured,
  canFeature = true,
}: {
  listingId: string;
  sellerId: string;
  status: ListingStatus;
  featured: boolean;
  // False once the seller has used their plan's featured allowance this month.
  canFeature?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [removing, setRemoving] = useState(false);
  const [reason, setReason] = useState("");

  function run(action: () => Promise<AdminResult>, done: string, after?: () => void) {
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(done);
        after?.();
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <RowMenuTrigger label="Listing actions" disabled={pending} />
        <RowMenuContent>
          <RowMenuHeader title="Manage listing">
            {featured && <Status tone="brand">Featured</Status>}
            <Status tone={STATUS_LABELS[status].tone}>{STATUS_LABELS[status].label}</Status>
          </RowMenuHeader>
          {status === "active" && (
            <MenuRow
              icon={ExternalLink}
              title="View listing"
              hint="As buyers see it"
              onSelect={() => router.push(`/listings/${listingId}`)}
            />
          )}
          <MenuRow
            icon={UserRound}
            title="Seller details"
            hint="Profile, plan and activity"
            onSelect={() => router.push(`/admin/users/${sellerId}`)}
          />
          {status === "active" &&
            canFeature &&
            FEATURE_OPTIONS.map((days) => (
              <MenuRow
                key={days}
                icon={Star}
                title={featured ? `Extend featured +${days}d` : `Feature for ${days} days`}
                hint={featured ? `${days} more days on top` : `Top of search for ${days} days`}
                onSelect={() =>
                  run(() => featureListingAction(listingId, days), featured ? `Featured ${days} more days` : `Featured for ${days} days`)
                }
              />
            ))}
          {status === "active" && featured && (
            <MenuRow
              icon={StarOff}
              title="Stop featuring"
              hint="Back to normal placement"
              onSelect={() => run(() => unfeatureListingAction(listingId), "No longer featured")}
            />
          )}
          {status === "removed" && (
            <MenuRow
              icon={RotateCcw}
              title="Restore listing"
              hint="Put it back in search"
              onSelect={() => run(() => restoreListingAction(listingId), "Listing restored")}
            />
          )}
          {status === "active" && (
            <>
              <DangerZone />
              <MenuRow
                danger
                icon={Trash2}
                title="Remove listing…"
                hint="Hide it and tell the seller"
                onSelect={() => setRemoving(true)}
              />
            </>
          )}
        </RowMenuContent>
      </DropdownMenu>

      <Dialog open={removing} onOpenChange={setRemoving}>
        <DialogContent className="sm:max-w-md">
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              run(() => removeListingAction(listingId, reason), "Listing removed", () => {
                setRemoving(false);
                setReason("");
              });
            }}
          >
            <DialogHeader>
              <DialogTitle>Remove this listing?</DialogTitle>
              <DialogDescription>
                It disappears from search and its open reports are closed. The seller sees your reason.
              </DialogDescription>
            </DialogHeader>
            <textarea
              autoFocus
              required
              maxLength={300}
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Reason shown to seller"
              aria-label="Reason shown to seller"
              className="rounded-md border border-input px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
            <DialogFooter>
              <button type="button" onClick={() => setRemoving(false)} className={secondaryButtonClass}>
                Cancel
              </button>
              <button type="submit" disabled={pending} className={dangerButtonClass}>
                {pending ? "Working…" : "Remove listing"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
