import Image from "next/image";
import Link from "@/components/locale-link";

// Trimmed from public/Logo.svg. logo-light.png swaps the navy for white so it
// reads on the dark header, footer and admin panels.
const LOGO_WIDTH = 800;
const LOGO_HEIGHT = 288;

export function Logo({
  tone = "light",
  className = "h-10 w-auto",
  priority = false,
}: {
  tone?: "light" | "dark";
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={tone === "light" ? "/logo-light.png" : "/logo.png"}
      alt="KarSouq"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      priority={priority}
      className={className}
    />
  );
}

export function BrandLink({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <Link href="/" className="flex shrink-0 items-center">
      <Logo tone={tone} className="h-9 w-auto md:h-11" />
    </Link>
  );
}
