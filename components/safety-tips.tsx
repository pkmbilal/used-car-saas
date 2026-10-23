import { ShieldAlert } from "lucide-react";

const TIPS = [
  "Meet in a busy public place, in daylight.",
  "Never pay a deposit or transfer money before you've seen the car.",
  "Check the Istimara matches the seller's ID and the car's VIN.",
  "Have the car inspected by a mechanic you trust.",
];

export function SafetyTips() {
  return (
    <section className="rounded-lg bg-mint px-5 py-4 text-ink">
      <h2 className="flex items-center gap-2 text-label font-semibold">
        <ShieldAlert className="size-4 text-brand" />
        Stay safe when buying
      </h2>
      <ul className="mt-2.5 flex list-disc flex-col gap-1.5 pl-5 text-caption leading-relaxed text-ink/75">
        {TIPS.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </section>
  );
}
