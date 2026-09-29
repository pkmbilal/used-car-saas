"use server";

import { revalidatePath } from "next/cache";
import {
  approveIdVerification,
  dismissReports,
  featureListing,
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

export async function setUserPlanAction(userId: string, plan: string) {
  return revalidating(setUserPlan(userId, plan));
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
