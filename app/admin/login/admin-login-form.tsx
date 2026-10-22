"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { adminLoginAction, type AdminLoginState } from "./actions";

const initialState: AdminLoginState = { email: "" };

const inputClass =
  "h-11 w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-zinc-400 focus:border-brand focus:ring-4 focus:ring-brand/15 aria-invalid:border-red-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

const labelClass = "text-label font-medium text-ink dark:text-zinc-200";

export function AdminLoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(adminLoginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const invalid = Boolean(state.error);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" aria-hidden />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            autoFocus
            defaultValue={state.email}
            placeholder="you@karsouq.com"
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? "login-error" : undefined}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <Link
            href="/forgot-password?next=/admin"
            className="text-caption font-medium text-brand hover:underline dark:text-lime"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" aria-hidden />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? "login-error" : undefined}
            className={`${inputClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-ink dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        </div>
      </div>

      {state.error && (
        <p
          id="login-error"
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 flex h-11 items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus-visible:ring-4 focus-visible:ring-brand/25 focus-visible:outline-none disabled:opacity-70"
      >
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
