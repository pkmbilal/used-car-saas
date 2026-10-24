"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { useDictionary } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { whatsappUrl } from "@/lib/format";
import type { ContactKind } from "@/lib/listings";
import { revealPhone } from "./actions";
import { ContactLink } from "./contact-link";

// Numbers revealed on this page, shared by every ContactButtons (the sidebar
// and the mobile bar) so one reveal shows both.
const revealed = new Map<string, string>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function remember(sellerId: string, phone: string) {
  revealed.set(sellerId, phone);
  listeners.forEach((listener) => listener());
}

const VARIANTS = {
  sidebar: {
    wrap: "mt-4 flex flex-col gap-2.5",
    size: "default",
    primary: "h-11 text-label font-semibold hover:bg-brand-dark hover:text-white",
    outline: "h-11 border-brand text-label font-semibold text-ink hover:bg-mint",
    reveal: "showPhone",
    call: "callSeller",
    whatsapp: "whatsapp",
  },
  bar: {
    wrap: "flex items-center gap-2.5",
    size: "sm",
    primary: "h-10 px-4 text-xs max-sm:text-sm font-semibold",
    outline: "h-10 border-brand px-4 text-xs max-sm:text-sm font-semibold text-ink",
    reveal: "showNumber",
    call: "call",
    whatsapp: "whatsapp",
  },
  dealer: {
    wrap: "mt-4 flex flex-wrap items-center gap-3",
    size: "default",
    primary: "hover:bg-brand-dark hover:text-white",
    outline: "border-brand text-ink hover:bg-mint",
    reveal: "showPhone",
    call: "callDealer",
    whatsapp: "whatsappDealer",
  },
} as const;

// Seller numbers aren't in the page: "Show phone number" fetches it (rate
// limited per IP), then Call / WhatsApp become real links. With a listingId,
// taps are counted for the seller's stats.
export function ContactButtons({
  sellerId,
  listingId,
  whatsappText,
  variant,
}: {
  sellerId: string;
  listingId?: string;
  whatsappText: string;
  variant: keyof typeof VARIANTS;
}) {
  const style = VARIANTS[variant];
  const { t } = useDictionary();
  const c = t.listingPage.contact;
  const phone = useSyncExternalStore(
    subscribe,
    () => revealed.get(sellerId) ?? null,
    () => null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reveal() {
    setError(null);
    startTransition(async () => {
      const result = await revealPhone(sellerId);
      if ("phone" in result) remember(sellerId, result.phone);
      else
        setError(result.error === "rate_limited" ? c.rateLimited : c.unavailable);
    });
  }

  if (!phone) {
    return (
      <div className={style.wrap}>
        <Button size={style.size} className={style.primary} onClick={reveal} disabled={pending}>
          <Phone className="size-4" />
          {pending ? c.loading : c[style.reveal]}
        </Button>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={style.wrap}>
      <Button asChild size={style.size} className={style.primary}>
        <TrackedLink listingId={listingId} kind="call" href={`tel:${phone}`}>
          <Phone className="size-4" />
          {c[style.call]}
          {/* Phone numbers read left to right on Arabic pages too. */}
          {variant !== "bar" && (
            <>
              {" · "}
              <span dir="ltr">{phone}</span>
            </>
          )}
        </TrackedLink>
      </Button>
      <Button asChild size={style.size} variant="outline" className={style.outline}>
        <TrackedLink
          listingId={listingId}
          kind="whatsapp"
          href={whatsappUrl(phone, whatsappText)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle className="size-4 text-brand" />
          {c[style.whatsapp]}
        </TrackedLink>
      </Button>
    </div>
  );
}

function TrackedLink({
  listingId,
  kind,
  ...props
}: React.ComponentProps<"a"> & { listingId?: string; kind: ContactKind }) {
  return listingId ? <ContactLink listingId={listingId} kind={kind} {...props} /> : <a {...props} />;
}
