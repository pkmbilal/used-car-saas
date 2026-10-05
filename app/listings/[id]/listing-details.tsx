import type { ReactNode } from "react";
import {
  Armchair,
  Bluetooth,
  Camera,
  Check,
  Disc3,
  Gauge,
  KeyRound,
  MonitorSmartphone,
  Navigation,
  Radar,
  Smartphone,
  Snowflake,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { featureLabel, type Feature } from "@/lib/listing-options";

// Spec tiles, a features list and a free-text description for the listing
// page. Features and description render nothing when the listing has none.

export type Spec = { label: string; value: string | null | undefined; icon: ReactNode };

export function SpecGrid({ specs }: { specs: Spec[] }) {
  const shown = specs.filter((spec): spec is Spec & { value: string } => Boolean(spec.value));

  return (
    <section>
      <h2 className="text-lg font-semibold">Overview</h2>
      <dl className="mt-4 grid grid-cols-2 border-t border-line sm:grid-cols-4">
        {shown.map((spec) => (
          <div key={spec.label} className="flex items-center gap-3 border-b border-line py-4 pr-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-mint text-brand">
              {spec.icon}
            </span>
            <div className="min-w-0">
              <dt className="text-caption text-muted-foreground">{spec.label}</dt>
              <dd className="mt-0.5 truncate text-label font-semibold">{spec.value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}

// Typed by Feature so a new feature without an icon fails typecheck.
const FEATURE_ICONS: Record<Feature, LucideIcon> = {
  sunroof: Sun,
  leather_seats: Armchair,
  navigation: Navigation,
  rear_camera: Camera,
  bluetooth: Bluetooth,
  parking_sensors: Radar,
  cruise_control: Gauge,
  apple_carplay: Smartphone,
  android_auto: MonitorSmartphone,
  keyless_entry: KeyRound,
  climate_control: Snowflake,
  alloy_wheels: Disc3,
};

function featureIcon(value: string): LucideIcon {
  return FEATURE_ICONS[value as Feature] ?? Check;
}

export function ListingFeatures({ features }: { features: readonly string[] }) {
  if (!features.length) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold">Features</h2>
      <ul className="mt-4 grid gap-x-5 gap-y-3 sm:grid-cols-3">
        {features.map((feature) => {
          const Icon = featureIcon(feature);
          return (
            <li key={feature} className="flex items-center gap-3 text-xs text-ink/85">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-mint text-brand-600">
                <Icon className="size-3.5" strokeWidth={1.8} />
              </span>
              {featureLabel(feature)}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ListingDescription({ text }: { text?: string | null }) {
  if (!text?.trim()) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold">Description</h2>
      <p className="mt-3 max-w-xl text-label leading-relaxed whitespace-pre-line text-ink/75">{text}</p>
    </section>
  );
}
