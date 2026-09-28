"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/auth";
import { requestIdDocUpload, submitIdVerification } from "@/lib/verification";

export type ActionResult = { error?: string };

// Browser asks for a presigned URL, PUTs straight to the private bucket, then
// submits the keys it uploaded.
export async function requestIdDocUploadAction(contentType: string, size: number) {
  const { user, profile } = await requireSeller("/account/verification");
  if (profile.id_verified_at) return { error: "Your ID is already verified." };
  return requestIdDocUpload(user.id, contentType, size);
}

export async function submitIdVerificationAction(keys: string[]): Promise<ActionResult> {
  const { user, profile } = await requireSeller("/account/verification");
  if (profile.suspended_at) return { error: "Your account is suspended." };
  if (profile.id_verified_at) return { error: "Your ID is already verified." };

  const error = await submitIdVerification(user.id, keys);
  if (error) return { error };

  revalidatePath("/account", "layout");
  return {};
}
