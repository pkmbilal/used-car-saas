import type { AdminActionType } from "@/lib/admin";

export const PLAN_CHANGE_SOURCES = {
  admin: "Admin",
  dealer_application: "Dealer application",
  expiry: "Expired",
} as const;

export const ADMIN_ACTION_LABELS: Record<AdminActionType, string> = {
  listing_removed: "Removed listing",
  listing_restored: "Restored listing",
  reports_dismissed: "Dismissed reports on",
  listing_unfeatured: "Unfeatured",
  user_suspended: "Suspended",
  user_unsuspended: "Unsuspended",
  id_approved: "Approved ID verification for",
  id_rejected: "Rejected ID verification for",
  id_revoked: "Revoked ID badge of",
  dealer_approved: "Approved dealer application from",
  dealer_rejected: "Rejected dealer application from",
};
