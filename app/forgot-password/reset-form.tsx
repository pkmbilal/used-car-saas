"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CodeStep, Field, FormMessages, primaryButtonClass } from "@/components/auth-fields";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-validation";
import { resetAction, type ResetState } from "./actions";

const initialState: ResetState = { step: "email", email: "" };

export function ResetForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(resetAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="next" value={next} />

      {state.step === "email" && (
        <>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Enter your email and we&apos;ll send you a code to choose a new password.
          </p>
          <Field
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            defaultValue={state.email}
          />
          <FormMessages error={state.error} notice={state.notice} />
          <button type="submit" name="intent" value="request" disabled={pending} className={primaryButtonClass}>
            {pending ? "Sending…" : "Send code"}
          </button>
          <Link href="/login" className="text-sm text-zinc-600 dark:text-zinc-400">
            ← Back to sign in
          </Link>
        </>
      )}

      {state.step === "code" && (
        <>
          <FormMessages error={state.error} notice={state.notice} />
          <CodeStep email={state.email} pending={pending} submitLabel="Continue" />
        </>
      )}

      {state.step === "password" && (
        <>
          <input type="hidden" name="email" value={state.email} />
          <Field
            id="password"
            label="New password"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            autoFocus
          />
          <Field
            id="confirm_password"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
          />
          <FormMessages error={state.error} notice={state.notice} />
          <button
            type="submit"
            name="intent"
            value="set_password"
            disabled={pending}
            className={primaryButtonClass}
          >
            {pending ? "Saving…" : "Save password"}
          </button>
        </>
      )}
    </form>
  );
}
