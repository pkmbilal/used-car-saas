import "server-only";
import { randomUUID } from "node:crypto";
import { presignPut, PRIVATE_BUCKET } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  ID_DOC_TYPES,
  isIdDocType,
  MAX_ID_DOC_BYTES,
  MAX_ID_DOCS,
} from "@/lib/verification-options";

// Seller side of ID verification. Documents go browser → private R2 bucket via
// presigned PUTs; the request row (RLS-scoped) only stores their keys.

export type IdVerificationRequest =
  Database["public"]["Tables"]["id_verification_requests"]["Row"];

export async function getLatestIdVerificationRequest(
  userId: string,
): Promise<IdVerificationRequest | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("id_verification_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function docKeyPattern(userId: string) {
  return new RegExp(`^id-verification/${userId}/[0-9a-f-]{36}\\.(jpg|png|webp|pdf)$`);
}

export async function requestIdDocUpload(
  userId: string,
  contentType: string,
  size: number,
): Promise<{ url: string; key: string } | { error: string }> {
  if (!isIdDocType(contentType)) return { error: "Use a JPEG, PNG, WebP or PDF file." };
  if (!Number.isInteger(size) || size <= 0 || size > MAX_ID_DOC_BYTES) {
    return { error: "Files must be under 10 MB." };
  }

  const latest = await getLatestIdVerificationRequest(userId);
  if (latest?.status === "pending") return { error: "Your ID is already under review." };

  const key = `id-verification/${userId}/${randomUUID()}.${ID_DOC_TYPES[contentType]}`;
  const url = await presignPut(key, contentType, size, PRIVATE_BUCKET);
  return { url, key };
}

// Returns an error message, or undefined on success.
export async function submitIdVerification(
  userId: string,
  keys: string[],
): Promise<string | undefined> {
  const pattern = docKeyPattern(userId);
  if (keys.length === 0 || keys.length > MAX_ID_DOCS || new Set(keys).size !== keys.length) {
    return `Upload 1 or ${MAX_ID_DOCS} files.`;
  }
  if (!keys.every((key) => pattern.test(key))) return "Invalid upload.";

  // The insert policy rejects buyers, suspended and already-verified sellers;
  // the partial unique index rejects a second pending request.
  const supabase = await createClient();
  const { error } = await supabase
    .from("id_verification_requests")
    .insert({ user_id: userId, doc_keys: keys });
  if (!error) return undefined;
  return error.code === "23505"
    ? "Your ID is already under review."
    : "Could not submit your ID. Try again.";
}
