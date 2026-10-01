import Link from "next/link";

// Wordmark swoosh from the DriveLoop design.
export function LogoMark({ width = 90, color = "#4fd06a" }: { width?: number; color?: string }) {
  return (
    <svg width={width} height={(width * 34) / 96} viewBox="0 0 96 34" fill="none" aria-hidden="true">
      <path d="M2 20c10-2 18-10 34-12 18-2 36 2 52 8 4 2 6 4 6 6" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M14 22c18 0 50 0 70-2" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M78 24c0 6-4 9-8 9" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

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
