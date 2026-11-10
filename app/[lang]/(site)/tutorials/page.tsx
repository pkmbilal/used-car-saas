import type { Metadata } from "next";
import { ArrowUpRight, PlayCircle } from "lucide-react";
import Link from "@/components/locale-link";
import { getDictionary } from "@/lib/i18n-server";
import { pageMetadata } from "@/lib/seo";
import { TUTORIALS, tutorialPoster, tutorialVideo } from "@/lib/tutorials";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return pageMetadata({ title: t.tutorials.metaTitle, description: t.tutorials.metaDescription, path: "/tutorials" });
}

export default async function TutorialsPage() {
  const { t, locale } = await getDictionary();
  const p = t.tutorials;

  return (
    <main className="light flex-1 bg-canvas px-4 py-12 text-ink sm:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-brand">
          <PlayCircle className="size-4" aria-hidden />
          {p.eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{p.title}</h1>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{p.intro}</p>
          <Link
            href="/account/become-seller"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-forest"
          >
            {p.cta}
            <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden />
          </Link>
        </div>

        <ol className="mt-10 grid gap-6 md:grid-cols-2">
          {TUTORIALS.map((tutorial) => {
            const item = p.items[tutorial.slug];
            return (
              <li
                key={tutorial.slug}
                id={tutorial.slug}
                className="scroll-mt-24 overflow-hidden rounded-2xl bg-white shadow-[0_2px_10px_rgba(20,30,25,.06)] ring-1 ring-black/5"
              >
                <video
                  controls
                  playsInline
                  preload="none"
                  poster={tutorialPoster(locale, tutorial)}
                  className="aspect-video w-full bg-zinc-900"
                >
                  <source src={tutorialVideo(locale, tutorial)} type="video/mp4" />
                </video>
                <div className="flex gap-3 p-4 sm:p-5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-mint text-sm font-bold text-forest">
                    {Number(tutorial.n).toLocaleString(locale === "ar" ? "ar-SA" : "en-US")}
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-semibold">{item.title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </main>
  );
}
