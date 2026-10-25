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
};

export function Avatar({ name, size = "md" }: { name: string | null; size?: keyof typeof AVATAR_SIZES }) {
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
