import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/utils";

// A price with the Saudi Riyal symbol. The symbol is an image mask filled
// with the text colour, sized in em so it follows the price's font size.
export function RiyalPrice({ amount, className }: { amount: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline gap-[0.2em] whitespace-nowrap", className)}>
      <span
        aria-hidden
        className="inline-block h-[0.8em] w-[0.715em] shrink-0 bg-current [mask:url(/riyal-symbol.png)_center/contain_no-repeat]"
      />
      <span className="sr-only">SAR </span>
      {formatAmount(amount)}
    </span>
  );
}
