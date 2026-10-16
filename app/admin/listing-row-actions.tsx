"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminResult } from "@/lib/admin";
import type { ListingStatus } from "@/lib/listings";
import {
  featureListingAction,
  removeListingAction,
  restoreListingAction,
  unfeatureListingAction,
} from "./actions";

// Feature durations offered here; mirrors FEATURE_DAYS in lib/admin.
const FEATURE_OPTIONS = [7, 30];

// The ⋮ menu on a dashboard listing row: open it, feature it, take it down.
export function ListingRowActions({
  listingId,
  sellerId,
  status,
  featured,
}: {
  listingId: string;
  sellerId: string;
  status: ListingStatus;
  featured: boolean;
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
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" disabled={pending} aria-label="Listing actions">
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {status === "active" && (
            <DropdownMenuItem onSelect={() => router.push(`/listings/${listingId}`)}>View listing</DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => router.push(`/admin/users/${sellerId}`)}>Seller details</DropdownMenuItem>
          {status === "active" && (
            <>
              <DropdownMenuSeparator />
              {FEATURE_OPTIONS.map((days) => (
                <DropdownMenuItem
                  key={days}
                  onSelect={() =>
                    run(() => featureListingAction(listingId, days), featured ? `Featured ${days} more days` : `Featured for ${days} days`)
                  }
                >
                  {featured ? `Extend featured +${days}d` : `Feature for ${days} days`}
                </DropdownMenuItem>
              ))}
              {featured && (
                <DropdownMenuItem onSelect={() => run(() => unfeatureListingAction(listingId), "No longer featured")}>
                  Stop featuring
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setRemoving(true)}>
                Remove listing…
              </DropdownMenuItem>
            </>
          )}
          {status === "removed" && (
            <DropdownMenuItem onSelect={() => run(() => restoreListingAction(listingId), "Listing restored")}>
              Restore listing
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={removing} onOpenChange={setRemoving}>
        <DialogContent>
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
              <Button type="button" variant="outline" onClick={() => setRemoving(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={pending}>
                Remove listing
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
