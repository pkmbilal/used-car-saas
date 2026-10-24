import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <main className="light flex flex-1 flex-col items-center bg-canvas px-4 py-24 text-center text-ink">
      <span className="flex size-14 items-center justify-center rounded-full bg-mint text-brand">
        <SearchX className="size-7" strokeWidth={1.6} />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Button asChild className="mt-6 h-10 px-5 text-xs max-sm:text-sm font-semibold">
        <Link href="/admin">Back to admin</Link>
      </Button>
    </main>
  );
}
