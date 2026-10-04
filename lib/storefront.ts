import "server-only";
import { DEALER_PLANS } from "@/lib/dealer-application-options";
import { isDealerPlan, type Plan } from "@/lib/plans";
import { publicUrl } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";
import {
  ABOUT_MAX,
  BUSINESS_NAME_MAX,
  SHOWROOM_ADDRESS_MAX,
} from "@/lib/storefront-options";

export type StorefrontInput = {
  business_name: string;
  about: string | null;
  showroom_address: string | null;
};

// Dealer branding as shown to buyers; null for sellers not on a dealer plan
// (their stored fields are ignored until they upgrade).
export type Storefront = {
  name: string;
  about: string | null;
  showroomAddress: string | null;
  logoUrl: string | null;
};

type StorefrontProfile = {
  plan: Plan;
  full_name: string | null;
  business_name: string | null;
  about: string | null;
  logo_key: string | null;
  showroom_address: string | null;
};

export function getStorefront(profile: StorefrontProfile): Storefront | null {
  if (!isDealerPlan(profile.plan)) return null;
  return {
    name: profile.business_name ?? profile.full_name ?? "Dealer",
    about: profile.about,
    showroomAddress: profile.showroom_address,
    logoUrl: profile.logo_key ? publicUrl(profile.logo_key) : null,
  };
}

export type DealerSummary = Awaited<ReturnType<typeof getDealerStorefronts>>[number];

// Public dealer directory: every non-suspended seller on a dealer plan.
export async function getDealerStorefronts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, city, created_at, email_verified_at, id_verified_at, plan, business_name, about, logo_key, showroom_address, listings!listings_seller_id_fkey(count)",
    )
    .eq("role", "seller")
    .in("plan", DEALER_PLANS)
    .is("suspended_at", null)
    .eq("listings.status", "active")
    .order("business_name", { ascending: true });
  if (error) throw error;

  return data.flatMap(({ listings, ...profile }) => {
    const storefront = getStorefront(profile);
    if (!storefront) return [];
    return [{ id: profile.id, storefront, profile, activeListings: listings[0]?.count ?? 0 }];
  });
}

export function parseStorefront(
  formData: FormData,
): { data: StorefrontInput } | { error: string } {
  const businessName = String(formData.get("business_name") ?? "").trim();
  const about = String(formData.get("about") ?? "").trim();
  const address = String(formData.get("showroom_address") ?? "").trim();

  if (businessName.length < 2 || businessName.length > BUSINESS_NAME_MAX) {
    return { error: `Business name must be 2–${BUSINESS_NAME_MAX} characters.` };
  }
  if (about.length > ABOUT_MAX) {
    return { error: `About must be at most ${ABOUT_MAX} characters.` };
  }
  if (address.length > SHOWROOM_ADDRESS_MAX) {
    return { error: `Showroom address must be at most ${SHOWROOM_ADDRESS_MAX} characters.` };
  }

  return {
    data: {
      business_name: businessName,
      about: about || null,
      showroom_address: address || null,
    },
  };
}

export function logoKeyPattern(userId: string): RegExp {
  return new RegExp(`^logos/${userId}/[0-9a-f-]{36}\\.(jpg|png|webp)$`);
}
