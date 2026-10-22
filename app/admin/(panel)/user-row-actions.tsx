"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeX, Ban, ExternalLink, MoreHorizontal, ShieldCheck, UserRound, type LucideIcon } from "lucide-react";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminResult } from "@/lib/admin";
import { revokeIdVerificationAction, suspendUserAction, unsuspendUserAction } from "./actions";
import { dangerButtonClass, secondaryButtonClass } from "./ui";

type Confirm = { title: string; description: string; label: string; action: () => Promise<AdminResult>; done: string };

const STATUS_TONES = {
  green: "bg-green-500",
  red: "bg-red-500",
  brand: "bg-brand dark:bg-lime",
} as const;

// A dot and a word for the menu header, e.g. "• Active".
function Status({ tone, children }: { tone: keyof typeof STATUS_TONES; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
      <span aria-hidden className={`size-1.5 rounded-full ${STATUS_TONES[tone]}`} />
      {children}
    </span>
  );
}

// One menu item: an icon tile, a title and a short hint underneath. The item's
// focus style recolours every descendant, hence the `!` on the focus colours.
function MenuRow({
  icon: Icon,
  title,
  hint,
  danger = false,
  onSelect,
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
  danger?: boolean;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem
      variant={danger ? "destructive" : "default"}
      onSelect={onSelect}
      className="cursor-pointer gap-3 rounded-lg px-2 py-2 transition-colors"
    >
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-lg ring-1 transition-colors ${
          danger
            ? "bg-red-50 text-red-600 ring-red-100 dark:bg-red-950/60 dark:text-red-400 dark:ring-red-900/60"
            : "bg-canvas text-forest ring-line group-focus/dropdown-menu-item:bg-white! group-focus/dropdown-menu-item:text-brand! group-focus/dropdown-menu-item:ring-brand/20 dark:bg-zinc-800 dark:text-lime dark:ring-zinc-700 dark:group-focus/dropdown-menu-item:bg-zinc-900! dark:group-focus/dropdown-menu-item:text-lime!"
        }`}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{title}</span>
        <span
          className={`block truncate text-xs ${
            danger
              ? "text-red-600/70 dark:text-red-400/70"
              : "text-zinc-500 group-focus/dropdown-menu-item:text-zinc-600! dark:text-zinc-400 dark:group-focus/dropdown-menu-item:text-zinc-400!"
          }`}
        >
          {hint}
        </span>
      </span>
    </DropdownMenuItem>
  );
}

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
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            aria-label="User actions"
            className="rounded-full text-zinc-500 hover:bg-mint hover:text-forest aria-expanded:bg-mint aria-expanded:text-forest aria-expanded:ring-1 aria-expanded:ring-brand/20 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-lime dark:aria-expanded:bg-zinc-800 dark:aria-expanded:text-lime dark:aria-expanded:ring-zinc-700"
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-64 rounded-xl border border-line bg-white p-1.5 shadow-[0_16px_40px_-12px_rgba(21,32,26,0.22),0_2px_6px_rgba(21,32,26,0.06)] ring-0 [--accent-foreground:var(--color-ink)] [--accent:var(--color-mint)] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)] dark:[--accent-foreground:var(--color-zinc-50)] dark:[--accent:var(--color-zinc-800)]"
        >
          <DropdownMenuLabel className="flex items-center justify-between gap-2 px-2 pt-1.5 pb-2">
            <span className="text-eyebrow font-semibold tracking-[0.16em] text-zinc-500 uppercase">Manage user</span>
            <span className="flex items-center gap-1.5">
              {idVerified && <Status tone="brand">ID verified</Status>}
              {suspended ? <Status tone="red">Suspended</Status> : <Status tone="green">Active</Status>}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="mx-0 my-1 bg-line dark:bg-zinc-800" />
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
          {(idVerified || (!isSelf && !suspended)) && (
            <>
              <DropdownMenuSeparator className="mx-0 my-1.5 bg-line dark:bg-zinc-800" />
              <DropdownMenuLabel className="px-2 pt-0.5 pb-1 text-eyebrow font-semibold tracking-[0.16em] text-red-600/80 uppercase dark:text-red-400/80">
                Danger zone
              </DropdownMenuLabel>
            </>
          )}
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
