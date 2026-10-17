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
import { revokeIdVerificationAction, suspendUserAction, unsuspendUserAction } from "./actions";
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
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" disabled={pending} aria-label="User actions">
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={() => router.push(`/admin/users/${userId}`)}>View details & plan</DropdownMenuItem>
          {isSeller && (
            <DropdownMenuItem onSelect={() => router.push(`/sellers/${userId}`)}>Public profile</DropdownMenuItem>
          )}
          {(idVerified || !isSelf) && <DropdownMenuSeparator />}
          {idVerified && (
            <DropdownMenuItem
              variant="destructive"
              onSelect={() =>
                setConfirm({
                  title: "Revoke the ID badge?",
                  description: "The ID verified badge disappears from their profile and listings. They can apply again.",
                  label: "Revoke badge",
                  action: () => revokeIdVerificationAction(userId),
                  done: "ID badge revoked",
                })
              }
            >
              Revoke ID badge…
            </DropdownMenuItem>
          )}
          {!isSelf &&
            (suspended ? (
              <DropdownMenuItem onSelect={() => run(() => unsuspendUserAction(userId), "User unsuspended")}>
                Unsuspend
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                variant="destructive"
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
              >
                Suspend…
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
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
