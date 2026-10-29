"use server";

import { headers } from "next/headers";
import { isInSaudi, roundPoint, type GeoPoint } from "@/lib/cities";

// Rough position from the visitor's IP (set by Vercel), for when the browser
// won't share its location. Null locally and outside Saudi Arabia.
export async function approxLocation(): Promise<GeoPoint | null> {
  const h = await headers();
  const lat = Number(h.get("x-vercel-ip-latitude"));
  const lng = Number(h.get("x-vercel-ip-longitude"));
  if (!h.get("x-vercel-ip-latitude") || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return isInSaudi(lat, lng) ? roundPoint(lat, lng) : null;
}
