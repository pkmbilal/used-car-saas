import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
// Registration check, so dealers show as a verified showroom.
export async function DealerBadge() {
  const { t } = await getDictionary();
  return (
    <Badge title={t.common.verifiedShowroomTitle} className="bg-charcoal text-lime">
      <BadgeCheck />
      {t.common.verifiedShowroom}
    </Badge>
  );
}
