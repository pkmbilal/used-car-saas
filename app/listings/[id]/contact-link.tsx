"use client";

import type { ContactKind } from "@/lib/listings";
import { recordContact } from "./actions";

// A Call / WhatsApp link that counts one tap per kind per browser session,
// like ViewTracker. Works under <Button asChild>.
export function ContactLink({
  listingId,
  kind,
  onClick,
  ...props
}: React.ComponentProps<"a"> & { listingId: string; kind: ContactKind }) {
  function track(event: React.MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    const key = `contacted:${kind}:${listingId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage unavailable (private mode, blocked): count anyway.
    }
    recordContact(listingId, kind).catch(() => {});
  }

  return <a {...props} onClick={track} />;
}
