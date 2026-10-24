import { formatAmount } from "@/lib/format";
import { getDictionary } from "@/lib/i18n-server";
import { cn } from "@/lib/utils";

// A price with the Saudi Riyal symbol. The symbol is an image mask filled
// with the text colour, sized in em so it follows the price's font size.
// Arabic puts the currency after the number, so RTL pages swap the order.
export async function RiyalPrice({ amount, className }: { amount: number; className?: string }) {
  const { t } = await getDictionary();
  return (
    <span className={cn("inline-flex items-baseline gap-[0.2em] whitespace-nowrap rtl:flex-row-reverse", className)}>
      <span
        aria-hidden
        className="inline-block h-[0.8em] w-[0.715em] shrink-0 bg-current [mask:url(/riyal-symbol.png)_center/contain_no-repeat]"
      />
      <span className="sr-only">{t.common.sarSr}</span>
      {formatAmount(amount)}
    </span>
  );
}
