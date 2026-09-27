// Presentational pieces shared by the sign-in, sign-up and reset forms.
// Each form is a single <form>; buttons pick the step via name="intent".

export const inputClass =
  "rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export const primaryButtonClass =
  "rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900";

const linkButtonClass = "text-sm font-medium underline-offset-4 hover:underline disabled:opacity-50";

export function Field({
  id,
  label,
  ...input
}: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input id={id} name={id} required className={inputClass} {...input} />
    </div>
  );
}

export function FormMessages({ error, notice }: { error?: string; notice?: string }) {
  return (
    <>
      {notice && <p className="text-sm text-zinc-600 dark:text-zinc-400">{notice}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
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
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Enter the 6-digit code sent to <strong>{email}</strong>.
      </p>
      <input type="hidden" name="email" value={email} />
      <Field
        id="code"
        label="Code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        autoFocus
        className={`${inputClass} tracking-[0.5em]`}
      />
      <button type="submit" name="intent" value="verify" disabled={pending} className={primaryButtonClass}>
        {pending ? "Checking…" : submitLabel}
      </button>
      <div className="flex justify-between">
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
