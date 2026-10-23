"use client";

// Presentational pieces shared by the sign-in, sign-up and reset forms.
// Each form is a single <form>; buttons pick the step via name="intent".
// They render inside AuthShell, which is light-only.

import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// text-base keeps inputs at 16px+ on phones so iOS Safari doesn't zoom on focus.
export const inputClass =
  "h-12 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-base text-ink outline-none transition placeholder:text-zinc-400 focus:border-brand focus:ring-4 focus:ring-brand/15";

export const primaryButtonClass =
  "flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-base font-semibold text-white shadow-sm transition hover:bg-brand-dark focus-visible:ring-4 focus-visible:ring-brand/25 focus-visible:outline-none active:scale-[0.99] disabled:opacity-70";

export const authLinkClass = "font-semibold text-brand underline-offset-4 hover:underline";

const labelClass = "text-label font-medium text-ink";

const linkButtonClass = "text-sm font-semibold text-brand underline-offset-4 hover:underline disabled:opacity-50";

type InputProps = { id: string; label: string; icon?: LucideIcon; aside?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>;

function Label({ id, label, aside }: { id: string; label: string; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {aside}
    </div>
  );
}

// `aside` sits at the end of the label row (e.g. a "Forgot password?" link).
export function Field({ id, label, icon: Icon, aside, className, ...input }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label id={id} label={label} aside={aside} />
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute top-1/2 start-3.5 size-[18px] -translate-y-1/2 text-zinc-400" aria-hidden />
        )}
        <input id={id} name={id} required className={cn(inputClass, Icon && "ps-10", className)} {...input} />
      </div>
    </div>
  );
}

export function PasswordField({ id, label, aside, ...input }: Omit<InputProps, "icon" | "type">) {
  const [shown, setShown] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <Label id={id} label={label} aside={aside} />
      <div className="relative">
        <Lock className="pointer-events-none absolute top-1/2 start-3.5 size-[18px] -translate-y-1/2 text-zinc-400" aria-hidden />
        <input
          id={id}
          name={id}
          required
          type={shown ? "text" : "password"}
          className={cn(inputClass, "pe-12 ps-10")}
          {...input}
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? "Hide password" : "Show password"}
          aria-pressed={shown}
          className="absolute top-1/2 end-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-ink"
        >
          {shown ? <EyeOff className="size-[18px]" aria-hidden /> : <Eye className="size-[18px]" aria-hidden />}
        </button>
      </div>
    </div>
  );
}

export function SubmitButton({
  intent,
  pending,
  pendingLabel,
  children,
}: {
  intent: string;
  pending: boolean;
  pendingLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button type="submit" name="intent" value={intent} disabled={pending} className={cn(primaryButtonClass, "mt-1")}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {pending ? pendingLabel : children}
    </button>
  );
}

export function FormMessages({ error, notice }: { error?: string; notice?: string }) {
  return (
    <>
      {notice && (
        <p role="status" className="rounded-xl border border-brand/15 bg-mint px-3.5 py-2.5 text-sm text-forest">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}
    </>
  );
}

// 6-digit code entry with resend and "different email" buttons.
export function CodeStep({
  email,
  pending,
  submitLabel,
}: {
  email: string;
  pending: boolean;
  submitLabel: string;
}) {
  return (
    <>
      <p className="text-sm text-zinc-600">
        Enter the 6-digit code we sent to{" "}
        <span className="inline-block max-w-full truncate rounded-md bg-mint px-1.5 align-bottom font-semibold text-forest">
          {email}
        </span>
      </p>
      <input type="hidden" name="email" value={email} />
      <Field
        id="code"
        label="Verification code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        autoFocus
        placeholder="••••••"
        className="h-14 text-center text-2xl font-semibold tracking-[0.5em] placeholder:tracking-[0.5em]"
      />
      <SubmitButton intent="verify" pending={pending} pendingLabel="Checking…">
        {submitLabel}
      </SubmitButton>
      <div className="flex justify-between gap-4">
        <button
          type="submit"
          name="intent"
          value="resend"
          formNoValidate
          disabled={pending}
          className={linkButtonClass}
        >
          Resend code
        </button>
        <button
          type="submit"
          name="intent"
          value="back"
          formNoValidate
          disabled={pending}
          className={linkButtonClass}
        >
          Use a different email
        </button>
      </div>
    </>
  );
}
