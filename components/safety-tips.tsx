import { ShieldAlert } from "lucide-react";
import { getDictionary } from "@/lib/i18n-server";

export async function SafetyTips() {
  const { t } = await getDictionary();
  return (
    <section className="rounded-lg bg-mint px-5 py-4 text-ink">
      <h2 className="flex items-center gap-2 text-label font-semibold">
        <ShieldAlert className="size-4 text-brand" />
        {t.safety.title}
      </h2>
      <ul className="mt-2.5 flex list-disc flex-col gap-1.5 ps-5 text-caption leading-relaxed text-ink/75">
        {t.safety.tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </section>
  );
}
