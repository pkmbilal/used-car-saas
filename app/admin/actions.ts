"use server";

import { revalidatePath } from "next/cache";
import {
  dismissReports,
  removeListing,
  restoreListing,
  suspendUser,
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

export async function suspendUserAction(userId: string) {
  return revalidating(suspendUser(userId));
}

export async function unsuspendUserAction(userId: string) {
  return revalidating(unsuspendUser(userId));
}
