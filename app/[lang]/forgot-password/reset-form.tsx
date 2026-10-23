"use client";

import Link from "@/components/locale-link";
import { useActionState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { CodeStep, Field, FormMessages, PasswordField, SubmitButton } from "@/components/auth-fields";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-validation";
import { resetAction, type ResetState } from "./actions";

const initialState: ResetState = { step: "email", email: "" };

export function ResetForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(resetAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      {state.step === "email" && (
        <>
          <Field
            id="email"
            label="Email"
            type="email"
            icon={Mail}
            autoComplete="email"
            placeholder="you@example.com"
            defaultValue={state.email}
          />
          <FormMessages error={state.error} notice={state.notice} />
          <SubmitButton intent="request" pending={pending} pendingLabel="Sending…">
            Send code
          </SubmitButton>
          <Link
            href="/login"
            className="mt-1 inline-flex items-center justify-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to sign in
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
          <PasswordField
            id="password"
            label="New password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            autoFocus
          />
          <PasswordField
            id="confirm_password"
            label="Confirm new password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
          />
          <FormMessages error={state.error} notice={state.notice} />
          <SubmitButton intent="set_password" pending={pending} pendingLabel="Saving…">
            Save password
          </SubmitButton>
        </>
      )}
    </form>
  );
}
