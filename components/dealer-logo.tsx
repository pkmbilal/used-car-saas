import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import { fmt } from "@/lib/dictionary";
import { getDictionary } from "@/lib/i18n-server";

type Props = {
  name: string;
  logoUrl: string | null;
  size: "sm" | "lg";
};

const sizeClass = { sm: "size-10 text-sm", lg: "size-20 text-2xl" };

// Dealer logo, or their initials when none is uploaded.
export async function DealerLogo({ name, logoUrl, size }: Props) {
  const { t } = await getDictionary();
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-lg border border-line bg-canvas ${sizeClass[size]}`}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={fmt(t.common.logoAlt, { name })}
          fill
          sizes={size === "lg" ? "80px" : "40px"}
          className="object-contain"
        />
      ) : (
        <span
          aria-hidden
          className="flex size-full items-center justify-center font-semibold text-brand"
        >
          {initials}
        </span>
      )}
    </div>
  );
}

// Every seller on a dealer plan was approved by an admin after a Commercial
// Registration check, so dealers get a verified tick right after their name
// (or the car title on listing cards). Sized in em to match the text.
// `shine` adds the hover shine sweep (listing cards, inside a `group`).
export async function VerifiedTick({ shine = false }: { shine?: boolean }) {
  const { t } = await getDictionary();
  return (
    <span title={t.common.verifiedShowroom} className={`inline-flex shrink-0 ${shine ? "ks-tick" : ""}`}>
      <BadgeCheck aria-hidden className="size-[1.1em] fill-brand stroke-white" />
      <span className="sr-only">{t.common.verifiedShowroom}</span>
    </span>
  );
}
