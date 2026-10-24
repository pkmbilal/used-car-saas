import Image from "next/image";
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

export async function DealerBadge() {
  const { t } = await getDictionary();
  return <Badge className="bg-charcoal text-lime">{t.common.dealer}</Badge>;
}
