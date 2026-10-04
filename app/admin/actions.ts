"use server";

import { revalidatePath } from "next/cache";
import {
  approveDealerApplication,
  approveIdVerification,
  dismissReports,
  extendUserPlan,
  featureListing,
  rejectDealerApplication,
  rejectIdVerification,
  removeListing,
  restoreListing,
  revokeIdVerification,
  setUserPlan,
  suspendUser,
  unfeatureListing,
  unsuspendUser,
  type AdminResult,
} from "@/lib/admin";
import type { PaymentInput } from "@/lib/payment-options";

// Moderation changes what buyers, sellers and admins all see.
async function revalidating(result: Promise<AdminResult>): Promise<AdminResult> {
  const outcome = await result;
  if (!outcome.error) revalidatePath("/", "layout");
  return outcome;
}

export async function removeListingAction(listingId: string, reason: string) {
  return revalidating(removeListing(listingId, reason));
}

export async function restoreListingAction(listingId: string) {
  return revalidating(restoreListing(listingId));
}

export async function dismissReportsAction(listingId: string) {
  return revalidating(dismissReports(listingId));
}

export async function featureListingAction(listingId: string, days: number) {
  return revalidating(featureListing(listingId, days));
}

export async function unfeatureListingAction(listingId: string) {
  return revalidating(unfeatureListing(listingId));
}

export async function suspendUserAction(userId: string) {
  return revalidating(suspendUser(userId));
}

export async function setUserPlanAction(
  userId: string,
  plan: string,
  months: number | null,
  note: string,
  payment: PaymentInput | null,
) {
  return revalidating(setUserPlan(userId, plan, months, note, payment));
}

export async function extendUserPlanAction(
  userId: string,
  months: number,
  note: string,
  payment: PaymentInput | null,
) {
  return revalidating(extendUserPlan(userId, months, note, payment));
}

export async function unsuspendUserAction(userId: string) {
  return revalidating(unsuspendUser(userId));
}

export async function approveIdVerificationAction(requestId: string) {
  return revalidating(approveIdVerification(requestId));
}

export async function rejectIdVerificationAction(requestId: string, reason: string) {
  return revalidating(rejectIdVerification(requestId, reason));
}

export async function revokeIdVerificationAction(userId: string) {
  return revalidating(revokeIdVerification(userId));
}

export async function approveDealerApplicationAction(
  applicationId: string,
  plan: string,
  months: number | null,
) {
  return revalidating(approveDealerApplication(applicationId, plan, months));
}

export async function rejectDealerApplicationAction(applicationId: string, reason: string) {
  return revalidating(rejectDealerApplication(applicationId, reason));
}
