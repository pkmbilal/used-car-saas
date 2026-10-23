import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export type RevealResult = { phone: string } | { error: "rate_limited" | "unavailable" };

// Only a hash of the visitor's IP is stored, for the per-IP rate limit.
async function visitorIpHash(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return createHash("sha256").update(ip).digest("hex");
}

// Seller phones aren't publicly readable; reveal_seller_phone() is service-role
// only because it trusts the IP hash we pass. It returns null for suspended
// sellers and sellers with nothing public.
export async function revealSellerPhone(sellerId: string): Promise<RevealResult> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("reveal_seller_phone", {
    p_seller_id: sellerId,
    p_ip_hash: await visitorIpHash(),
  });
  if (error?.message === "contact_rate_limited") return { error: "rate_limited" };
  if (error) {
    console.error("reveal_seller_phone failed", error);
    return { error: "unavailable" };
  }
  return data ? { phone: data } : { error: "unavailable" };
}
