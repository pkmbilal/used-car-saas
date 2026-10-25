const AVATAR_TONES = [
  "bg-emerald-100 text-emerald-800",
  "bg-sky-100 text-sky-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
  "bg-violet-100 text-violet-800",
  "bg-teal-100 text-teal-800",
];

// Initials on a colour picked from the name, so a person keeps theirs.
export function Avatar({ name, size = "md" }: { name: string | null; size?: "md" | "lg" }) {
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
      className={`grid shrink-0 place-items-center rounded-full font-semibold ${AVATAR_TONES[hash % AVATAR_TONES.length]} ${
        size === "lg" ? "size-16 text-xl" : "size-9 text-sm"
      }`}
    >
      {initials}
    </span>
  );
}
