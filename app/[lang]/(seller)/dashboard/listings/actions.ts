"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requestAddon } from "@/lib/addons";
import { requireSeller } from "@/lib/auth";
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/listing-options";
import { getSellerListing, parseListing, type ListingStatus } from "@/lib/listings";
import {
  bumpOwnListing,
  DRAFT_LIMIT_DB_MESSAGE,
  draftLimitMessage,
  featureOwnListing,
  getDraftUsage,
  getListingQuota,
  NOT_PUBLISHED_DB_MESSAGE,
  PHOTO_LIMIT,
  PHOTO_LIMIT_DB_MESSAGE,
  QUOTA_EXCEEDED_DB_MESSAGE,
  quotaExceededMessage,
} from "@/lib/plans";
import { deleteObjects, presignPut } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, localeRedirect, revalidateLocalized } from "@/lib/i18n-server";

export type ListingFormState = {
  error?: string;
  saved?: boolean;
};

export type ActionResult = { error?: string };

const SUSPENDED_ERROR = "Your account is suspended, so you can't publish listings.";
const NOT_PUBLISHED_ERROR = "Publish this listing before marking it sold.";

// Keys the presign step issues for a listing's photos.
function listingKeyPattern(listingId: string): RegExp {
  return new RegExp(`^listings/${listingId}/[0-9a-f-]{36}\\.(jpg|png|webp)$`);
}

// Rows can be written outside these actions, so only delete objects that sit
// under this listing's own folder.
function ownedKeys(listingId: string, keys: string[]): string[] {
  const pattern = listingKeyPattern(listingId);
  return keys.filter((key) => pattern.test(key));
}

function photoLimitError(max: number): string {
  return `A listing can have up to ${max} photos.`;
}

function revalidateDashboard() {
  revalidateLocalized("/dashboard", "layout");
}

// Featured listings show on the home page and at the top of search, not just
// the dashboard.
export async function featureListing(listingId: string): Promise<ActionResult> {
  await requireSeller();
  const result = await featureOwnListing(listingId);
  if (!result.error) {
    revalidatePath("/", "layout");
    return {};
  }
  const { t } = await getDictionary();
  return { error: t.plans.featureErrors[result.error] };
}

// Refreshing reorders "newest" on the home page and in search.
export async function bumpListing(listingId: string): Promise<ActionResult> {
  await requireSeller();
  const result = await bumpOwnListing(listingId);
  if (!result.error) {
    revalidatePath("/", "layout");
    return {};
  }
  const { t } = await getDictionary();
  return { error: t.plans.bumpErrors[result.error] };
}

// One-off add-ons: these only file a request; an admin applies it once paid.
export async function requestFeaturedBoost(listingId: string): Promise<ActionResult> {
  await requireSeller();
  return addonResult(await requestAddon("featured_boost", listingId, 1));
}

export async function requestExtraListings(quantity: number): Promise<ActionResult> {
  await requireSeller();
  return addonResult(await requestAddon("extra_listings", null, quantity));
}

async function addonResult(result: Awaited<ReturnType<typeof requestAddon>>): Promise<ActionResult> {
  if (!result.error) {
    revalidateDashboard();
    revalidateLocalized("/listings", "layout");
    return {};
  }
  const { t } = await getDictionary();
  return { error: t.addons.errors[result.error] };
}

export async function createListing(
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const { user, profile } = await requireSeller("/dashboard/listings/new");
  if (profile.suspended_at) return { error: SUSPENDED_ERROR };

  const parsed = parseListing(formData);
  if ("error" in parsed) return { error: parsed.error };

  // Friendly early check; the database trigger is what actually enforces it.
  const drafts = await getDraftUsage(user.id, profile.plan);
  if (drafts.remaining === 0) {
    const { t } = await getDictionary();
    return { error: draftLimitMessage(t, drafts) };
  }

  // Starts as a draft: photos need the listing id before it can go live.
  // Drafts don't use the monthly quota (it's charged on first publish), but
  // how many a seller can hold at once is capped.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .insert({ ...parsed.data, seller_id: user.id, status: "draft" })
    .select("id")
    .single();
  if (error?.message === DRAFT_LIMIT_DB_MESSAGE) {
    const { t } = await getDictionary();
    return { error: draftLimitMessage(t, drafts) };
  }
  if (error) return { error: "Could not create the listing. Try again." };

  revalidateDashboard();
  return localeRedirect(`/dashboard/listings/${data.id}/edit`);
}

export async function updateListing(
  listingId: string,
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const { user } = await requireSeller();

  const parsed = parseListing(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  // Category is fixed at creation: a car can't become equipment or back.
  const { data, error } = await supabase
    .from("listings")
    .update(parsed.data)
    .eq("id", listingId)
    .eq("seller_id", user.id)
    .eq("category", parsed.data.category)
    .select("id");
  if (error || data.length === 0) return { error: "Could not save the listing. Try again." };

  revalidateDashboard();
  return { saved: true };
}

export async function setListingStatus(
  listingId: string,
  status: ListingStatus,
): Promise<ActionResult> {
  const { user, profile } = await requireSeller();

  const listing = await getSellerListing(user.id, listingId);
  if (!listing) return { error: "Listing not found." };
  if (status === "removed" || listing.status === "removed") {
    return { error: "This listing was removed by moderators." };
  }
  if (status === "active" && profile.suspended_at) return { error: SUSPENDED_ERROR };
  if (status === "active" && listing.images.length === 0) {
    return { error: "Add at least one photo before publishing." };
  }
  if (status === "sold" && listing.first_published_at === null) {
    return { error: NOT_PUBLISHED_ERROR };
  }

  // A listing's first publish uses a monthly listing; relisting doesn't.
  // Friendly early check; the database trigger is what actually enforces it.
  const charged = status === "active" && listing.first_published_at === null;
  const quota = charged ? await getListingQuota() : null;
  const { t } = await getDictionary();
  if (quota?.remaining === 0) return { error: quotaExceededMessage(t, quota) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("listings")
    .update({ status })
    .eq("id", listingId)
    .eq("seller_id", user.id);
  if (error?.message === QUOTA_EXCEEDED_DB_MESSAGE && quota) {
    return { error: quotaExceededMessage(t, quota) };
  }
  if (error?.message === NOT_PUBLISHED_DB_MESSAGE) return { error: NOT_PUBLISHED_ERROR };
  if (error) return { error: "Could not update the listing. Try again." };

  revalidateDashboard();
  return {};
}

export async function deleteListing(listingId: string): Promise<ActionResult> {
  const { user } = await requireSeller();

  const listing = await getSellerListing(user.id, listingId);
  if (!listing) return { error: "Listing not found." };

  // Image rows cascade with the listing; R2 objects must be removed by hand.
  const supabase = await createClient();
  const { error } = await supabase
    .from("listings")
    .delete()
    .eq("id", listingId)
    .eq("seller_id", user.id);
  if (error) return { error: "Could not delete the listing. Try again." };

  await deleteObjects(
    ownedKeys(
      listingId,
      listing.images.map((image) => image.r2_key),
    ),
  ).catch((err) =>
    console.error("Failed to delete R2 objects for listing", listingId, err),
  );

  revalidateDashboard();
  return {};
}

// ---------------------------------------------------------------------------
// Images: browser asks for a presigned URL, PUTs straight to R2, then confirms.
// ---------------------------------------------------------------------------

export async function requestImageUpload(
  listingId: string,
  contentType: string,
  size: number,
): Promise<{ url: string; key: string } | { error: string }> {
  const { user, profile } = await requireSeller();

  if (!(contentType in IMAGE_TYPES)) return { error: "Use a JPEG, PNG or WebP photo." };
  if (!Number.isInteger(size) || size <= 0 || size > MAX_IMAGE_BYTES) {
    return { error: "Photos must be under 10 MB." };
  }

  const listing = await getSellerListing(user.id, listingId);
  if (!listing) return { error: "Listing not found." };
  const maxPhotos = PHOTO_LIMIT[profile.plan];
  if (listing.images.length >= maxPhotos) return { error: photoLimitError(maxPhotos) };

  const ext = IMAGE_TYPES[contentType as keyof typeof IMAGE_TYPES];
  const key = `listings/${listingId}/${randomUUID()}.${ext}`;
  const url = await presignPut(key, contentType, size);
  return { url, key };
}

export async function confirmImageUpload(
  listingId: string,
  key: string,
): Promise<ActionResult> {
  const { user, profile } = await requireSeller();

  const listing = await getSellerListing(user.id, listingId);
  if (!listing) return { error: "Listing not found." };

  // Only accept keys this listing's presign step could have issued.
  if (!listingKeyPattern(listing.id).test(key)) return { error: "Invalid upload." };
  const maxPhotos = PHOTO_LIMIT[profile.plan];
  if (listing.images.length >= maxPhotos) return { error: photoLimitError(maxPhotos) };

  const nextPosition = Math.max(-1, ...listing.images.map((image) => image.position)) + 1;
  const supabase = await createClient();
  const { error } = await supabase
    .from("listing_images")
    .insert({ listing_id: listingId, r2_key: key, position: nextPosition });
  if (error?.message === PHOTO_LIMIT_DB_MESSAGE) return { error: photoLimitError(maxPhotos) };
  if (error) return { error: "Could not save the photo. Try again." };

  revalidateDashboard();
  return {};
}

export async function deleteImage(listingId: string, imageId: string): Promise<ActionResult> {
  const { user } = await requireSeller();

  const listing = await getSellerListing(user.id, listingId);
  const image = listing?.images.find((i) => i.id === imageId);
  if (!listing || !image) return { error: "Photo not found." };
  if (listing.status === "active" && listing.images.length === 1) {
    return { error: "A published listing needs at least one photo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("listing_images").delete().eq("id", imageId);
  if (error) return { error: "Could not delete the photo. Try again." };

  await deleteObjects(ownedKeys(listingId, [image.r2_key])).catch((err) =>
    console.error("Failed to delete R2 object", image.r2_key, err),
  );

  revalidateDashboard();
  return {};
}

export async function moveImage(
  listingId: string,
  imageId: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const { user } = await requireSeller();

  const listing = await getSellerListing(user.id, listingId);
  if (!listing) return { error: "Listing not found." };

  const index = listing.images.findIndex((i) => i.id === imageId);
  const otherIndex = direction === "up" ? index - 1 : index + 1;
  const image = listing.images[index];
  const other = listing.images[otherIndex];
  if (!image || !other) return {};

  // Swap via a temporary position to satisfy unique (listing_id, position).
  const supabase = await createClient();
  const steps = [
    { id: image.id, position: -1 },
    { id: other.id, position: image.position },
    { id: image.id, position: other.position },
  ];
  for (const step of steps) {
    const { error } = await supabase
      .from("listing_images")
      .update({ position: step.position })
      .eq("id", step.id);
    if (error) return { error: "Could not reorder photos. Try again." };
  }

  revalidateDashboard();
  return {};
}
