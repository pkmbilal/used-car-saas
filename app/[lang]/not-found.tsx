import Link from "@/components/locale-link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n-server";

export default async function NotFound() {
  const { t } = await getDictionary();
  const e = t.errors;
  return (
    <main className="light flex flex-1 flex-col items-center bg-canvas px-4 py-24 text-center text-ink">
      <span className="flex size-14 items-center justify-center rounded-full bg-mint text-brand">
        <SearchX className="size-7" strokeWidth={1.6} />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">{e.notFoundTitle}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {e.notFoundText}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild className="h-10 px-5 text-xs max-sm:text-sm font-semibold">
          <Link href="/listings">{e.browse}</Link>
        </Button>
        <Button asChild variant="outline" className="h-10 bg-white px-5 text-xs max-sm:text-sm font-semibold">
          <Link href="/">{e.home}</Link>
        </Button>
      </div>
    </main>
  );
}
