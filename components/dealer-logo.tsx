import Image from "next/image";

type Props = {
  name: string;
  logoUrl: string | null;
  size: "sm" | "lg";
};

const sizeClass = { sm: "size-10 text-sm", lg: "size-20 text-2xl" };

// Dealer logo, or their initials when none is uploaded.
export function DealerLogo({ name, logoUrl, size }: Props) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 ${sizeClass[size]}`}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={`${name} logo`}
          fill
          sizes={size === "lg" ? "80px" : "40px"}
          className="object-contain"
        />
      ) : (
        <span
          aria-hidden
          className="flex size-full items-center justify-center font-semibold text-zinc-500"
        >
          {initials}
        </span>
      )}
    </div>
  );
}

export function DealerBadge() {
  return (
    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-300">
      Dealer
    </span>
  );
}
