import Image from "next/image";

const AVATAR_TONES = [
  "bg-emerald-100 text-emerald-800",
  "bg-sky-100 text-sky-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
  "bg-violet-100 text-violet-800",
  "bg-teal-100 text-teal-800",
];

// Initials on a colour picked from the name, so a person keeps theirs.
const AVATAR_SIZES = {
  sm: "size-6 text-[0.625rem]",
  md: "size-9 text-sm",
  lg: "size-16 text-xl",
  xl: "size-20 text-2xl",
};

const IMAGE_SIZES = { sm: "24px", md: "36px", lg: "64px", xl: "80px" };

// The profile photo when there is one, otherwise initials.
export function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string | null;
  src?: string | null;
  size?: keyof typeof AVATAR_SIZES;
}) {
  if (src) {
    return (
      <span aria-hidden className={`relative block shrink-0 overflow-hidden rounded-full bg-zinc-100 ${AVATAR_SIZES[size]}`}>
        <Image src={src} alt="" fill sizes={IMAGE_SIZES[size]} className="object-cover" />
      </span>
    );
  }

  const label = (name ?? "?").trim() || "?";
  const initials = label
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  let hash = 0;
  for (const char of label) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full font-semibold ${AVATAR_TONES[hash % AVATAR_TONES.length]} ${AVATAR_SIZES[size]}`}
    >
      {initials}
    </span>
  );
}
