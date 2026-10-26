"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeX, Ban, ExternalLink, ShieldCheck, UserRound } from "lucide-react";
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
import { revokeIdVerificationAction, suspendUserAction, unsuspendUserAction } from "./actions";
import { DangerZone, MenuRow, RowMenuContent, RowMenuHeader, RowMenuTrigger, Status } from "./row-menu";
import { dangerButtonClass, secondaryButtonClass } from "./ui";

type Confirm = { title: string; description: string; label: string; action: () => Promise<AdminResult>; done: string };

// The ⋮ menu on a user row. Suspending and revoking ask first.
export function UserRowActions({
  userId,
  isSeller,
  isSelf,
  suspended,
  idVerified,
}: {
  userId: string;
  isSeller: boolean;
  isSelf: boolean;
  suspended: boolean;
  idVerified: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  function run(action: () => Promise<AdminResult>, done: string, after?: () => void) {
    startTransition(async () => {
      const result = await action();
      if (result.error) toast.error(result.error);
      else {
        toast.success(done);
        after?.();
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <RowMenuTrigger label="User actions" disabled={pending} />
        <RowMenuContent>
          <RowMenuHeader title="Manage user">
            {idVerified && <Status tone="brand">ID verified</Status>}
            {suspended ? <Status tone="red">Suspended</Status> : <Status tone="green">Active</Status>}
          </RowMenuHeader>
          <MenuRow
            icon={UserRound}
            title="View details & plan"
            hint="Profile, plan and activity"
            onSelect={() => router.push(`/admin/users/${userId}`)}
          />
          {isSeller && (
            <MenuRow
              icon={ExternalLink}
              title="Public profile"
              hint="As buyers see it"
              onSelect={() => router.push(`/sellers/${userId}`)}
            />
          )}
          {!isSelf && suspended && (
            <MenuRow
              icon={ShieldCheck}
              title="Unsuspend"
              hint="Bring their listings back"
              onSelect={() => run(() => unsuspendUserAction(userId), "User unsuspended")}
            />
          )}
          {(idVerified || (!isSelf && !suspended)) && <DangerZone />}
          {idVerified && (
            <MenuRow
              danger
              icon={BadgeX}
              title="Revoke ID badge…"
              hint="Removes the verified mark"
              onSelect={() =>
                setConfirm({
                  title: "Revoke the ID badge?",
                  description: "The ID verified badge disappears from their profile and listings. They can apply again.",
                  label: "Revoke badge",
                  action: () => revokeIdVerificationAction(userId),
                  done: "ID badge revoked",
                })
              }
            />
          )}
          {!isSelf && !suspended && (
            <MenuRow
              danger
              icon={Ban}
              title="Suspend…"
              hint="Hide listings, block publishing"
              onSelect={() =>
                setConfirm({
                  title: "Suspend this user?",
                  description:
                    "Their live listings are hidden and they can't publish new ones until you unsuspend them.",
                  label: "Suspend user",
                  action: () => suspendUserAction(userId),
                  done: "User suspended",
                })
              }
            />
          )}
        </RowMenuContent>
      </DropdownMenu>

      <Dialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          {confirm && (
            <>
              <DialogHeader>
                <DialogTitle>{confirm.title}</DialogTitle>
                <DialogDescription>{confirm.description}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <button type="button" onClick={() => setConfirm(null)} className={secondaryButtonClass}>
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(confirm.action, confirm.done, () => setConfirm(null))}
                  className={dangerButtonClass}
                >
                  {pending ? "Working…" : confirm.label}
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
