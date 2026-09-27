"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSeller } from "@/lib/auth";
import {
  IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_IMAGES_PER_LISTING,
} from "@/lib/listing-options";
import { getSellerListing, parseListing, type ListingStatus } from "@/lib/listings";
import { deleteObjects, presignPut } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";

export type ListingFormState = {
  error?: string;
  saved?: boolean;
};

export type ActionResult = { error?: string };

const SUSPENDED_ERROR = "Your account is suspended, so you can't publish listings.";

function revalidateDashboard() {
  revalidatePath("/dashboard", "layout");
}

export async function createListing(
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const { user, profile } = await requireSeller("/dashboard/listings/new");
  if (profile.suspended_at) return { error: SUSPENDED_ERROR };

  const parsed = parseListing(formData);
  if ("error" in parsed) return { error: parsed.error };

  // Starts as a draft: photos need the listing id before it can go live.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .insert({ ...parsed.data, seller_id: user.id, status: "draft" })
    .select("id")
    .single();
  if (error) return { error: "Could not create the listing. Try again." };

  revalidateDashboard();
  redirect(`/dashboard/listings/${data.id}/edit`);
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
  const { error } = await supabase
    .from("listings")
    .update(parsed.data)
    .eq("id", listingId)
    .eq("seller_id", user.id);
  if (error) return { error: "Could not save the listing. Try again." };

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

  const supabase = await createClient();
  const { error } = await supabase
    .from("listings")
    .update({ status })
    .eq("id", listingId)
    .eq("seller_id", user.id);
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

  await deleteObjects(listing.images.map((image) => image.r2_key)).catch((err) =>
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
  const { user } = await requireSeller();

  if (!(contentType in IMAGE_TYPES)) return { error: "Use a JPEG, PNG or WebP photo." };
  if (!Number.isInteger(size) || size <= 0 || size > MAX_IMAGE_BYTES) {
    return { error: "Photos must be under 10 MB." };
  }

  const listing = await getSellerListing(user.id, listingId);
  if (!listing) return { error: "Listing not found." };
  if (listing.images.length >= MAX_IMAGES_PER_LISTING) {
    return { error: `A listing can have up to ${MAX_IMAGES_PER_LISTING} photos.` };
  }

  const ext = IMAGE_TYPES[contentType as keyof typeof IMAGE_TYPES];
  const key = `listings/${listingId}/${randomUUID()}.${ext}`;
  const url = await presignPut(key, contentType, size);
  return { url, key };
}

export async function confirmImageUpload(
  listingId: string,
  key: string,
): Promise<ActionResult> {
  const { user } = await requireSeller();

  const listing = await getSellerListing(user.id, listingId);
  if (!listing) return { error: "Listing not found." };

  // Only accept keys this listing's presign step could have issued.
  const keyPattern = new RegExp(`^listings/${listing.id}/[0-9a-f-]{36}\\.(jpg|png|webp)$`);
  if (!keyPattern.test(key)) return { error: "Invalid upload." };
  if (listing.images.length >= MAX_IMAGES_PER_LISTING) {
    return { error: `A listing can have up to ${MAX_IMAGES_PER_LISTING} photos.` };
  }

  const nextPosition = Math.max(-1, ...listing.images.map((image) => image.position)) + 1;
  const supabase = await createClient();
  const { error } = await supabase
    .from("listing_images")
    .insert({ listing_id: listingId, r2_key: key, position: nextPosition });
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

  await deleteObjects([image.r2_key]).catch((err) =>
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
