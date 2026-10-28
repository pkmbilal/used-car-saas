import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from "lucide-react";

type Tone = "warning" | "info" | "danger" | "success";

const TONES: Record<Tone, { icon: LucideIcon; box: string; iconClass: string }> = {
  warning: {
    icon: TriangleAlert,
    box: "bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-100 dark:ring-amber-900",
    iconClass: "text-amber-600 dark:text-amber-300",
  },
  info: {
    icon: Info,
    box: "bg-sky-50 text-sky-900 ring-sky-200 dark:bg-sky-950/60 dark:text-sky-100 dark:ring-sky-900",
    iconClass: "text-sky-600 dark:text-sky-300",
  },
  danger: {
    icon: CircleAlert,
    box: "bg-red-50 text-red-900 ring-red-200 dark:bg-red-950/60 dark:text-red-100 dark:ring-red-900",
    iconClass: "text-red-600 dark:text-red-300",
  },
  success: {
    icon: CircleCheck,
    box: "bg-mint text-forest ring-brand/20 dark:bg-lime/10 dark:text-lime dark:ring-lime/25",
    iconClass: "text-brand dark:text-lime",
  },
};

// A tinted callout with an icon, for warnings and status messages.
export function Notice({
  tone,
  title,
  children,
  className = "",
}: {
  tone: Tone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { icon: Icon, box, iconClass } = TONES[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : undefined}
      className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm ring-1 ${box} ${className}`}
    >
      <Icon className={`mt-0.5 size-4 shrink-0 ${iconClass}`} aria-hidden />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? "mt-0.5" : ""}>{children}</div>}
      </div>
    </div>
  );
}
