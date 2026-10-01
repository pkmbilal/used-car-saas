import Link from "next/link";
import { LogoMark } from "@/components/icons";

export function BrandLink({ tone = "light" }: { tone?: "light" | "dark" }) {
  const light = tone === "light";
  return (
    <Link
      href="/"
      className={`flex shrink-0 items-center gap-3 ${light ? "text-white" : "text-ink"}`}
    >
      <LogoMark width={80} color={light ? "#4fd06a" : "#2f8f46"} />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-bold tracking-tight">DriveLoop</span>
        <span className="mt-1 text-[7.5px] font-semibold tracking-[0.3em] opacity-85">
          BUY · SELL · DRIVE
        </span>
      </span>
    </Link>
  );
}
