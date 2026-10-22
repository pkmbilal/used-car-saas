import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { AdminLoginForm } from "./admin-login-form";

export const metadata: Metadata = {
  title: "Admin sign in | KarSouq",
  robots: { index: false },
};

// Outside the (panel) group, so the admin guard in its layout doesn't apply.
export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const requested = safeNext((await searchParams).next);
  const next = requested.startsWith("/admin") ? requested : "/admin";

  const current = await getCurrentUser();
  if (current?.profile.is_admin) redirect(next);

  return (
    <div className="flex min-h-svh flex-col bg-canvas lg:flex-row dark:bg-zinc-950">
      <BrandPanel />

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(21,32,26,0.04),0_12px_32px_-12px_rgba(21,32,26,0.18)] sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="grid size-11 place-items-center rounded-full bg-mint text-brand dark:bg-brand/20 dark:text-lime">
              <ShieldCheck className="size-5" aria-hidden />
            </span>
            <h1 className="mt-5 text-xl font-semibold tracking-tight text-ink dark:text-zinc-50">
              Sign in to admin
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Use your KarSouq admin account.
            </p>
            {current && (
              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-caption text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                You&apos;re signed in as {current.user.email}, which doesn&apos;t have admin access.
              </p>
            )}
            <div className="mt-6">
              <AdminLoginForm next={next} />
            </div>
          </div>

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-ink dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to KarSouq
          </Link>
        </div>
      </main>
    </div>
  );
}

function Wordmark() {
  return (
    <div className="flex items-center gap-4">
      <Logo className="h-10 w-auto lg:h-12" />
      <p className="border-l border-white/20 pl-4 text-eyebrow font-semibold tracking-[0.16em] text-lime">ADMIN CONSOLE</p>
    </div>
  );
}

// Forest panel on desktop; a slim header strip on phones.
function BrandPanel() {
  return (
    <aside className="pt-safe relative overflow-hidden bg-forest text-white lg:flex lg:w-[44%] lg:max-w-xl lg:flex-col">
      <RoadLines />

      <div className="relative px-4 py-5 sm:px-6 lg:px-12 lg:pt-12">
        <Wordmark />
      </div>

      <div className="relative hidden flex-1 flex-col justify-center px-12 lg:flex">
        <h2 className="max-w-sm text-4xl leading-[1.1] font-semibold tracking-tight">
          Run the <span className="text-lime">marketplace</span>.
        </h2>
        <p className="mt-4 max-w-sm text-base text-white/70">
          Moderate listings, review verifications and manage dealer plans, all in one place.
        </p>
      </div>

      <p className="relative hidden items-center gap-2 px-12 pb-10 text-caption text-white/55 lg:flex">
        <span className="size-1.5 rounded-full bg-lime" aria-hidden />
        Restricted area · every action is logged
      </p>
    </aside>
  );
}

// Faint perspective road lines and a glow behind the panel.
function RoadLines() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute -top-24 -right-24 size-80 rounded-full bg-lime/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-brand/30 blur-3xl" />
      <svg className="absolute inset-0 hidden size-full lg:block" preserveAspectRatio="none" viewBox="0 0 400 800">
        <g stroke="white" strokeOpacity="0.06" strokeWidth="1.5" fill="none">
          <path d="M200 380 L-40 800" />
          <path d="M200 380 L440 800" />
          <path d="M200 380 L120 800" />
          <path d="M200 380 L280 800" />
        </g>
        <path d="M200 380 L200 800" stroke="#6fe07c" strokeOpacity="0.14" strokeWidth="2" strokeDasharray="14 18" fill="none" />
      </svg>
    </div>
  );
}
