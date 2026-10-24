"use client";

import Link from "@/components/locale-link";
import { useActionState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { CodeStep, Field, FormMessages, PasswordField, SubmitButton } from "@/components/auth-fields";
import { useDictionary } from "@/components/i18n-provider";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-validation";
import { fmt } from "@/lib/dictionary";
import { resetAction, type ResetState } from "./actions";

const initialState: ResetState = { step: "email", email: "" };

export function ResetForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(resetAction, initialState);
  const { t } = useDictionary();
  const a = t.authPages;
  const p = a.reset;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      {state.step === "email" && (
        <>
          <Field
            id="email"
            label={a.email}
            type="email"
            icon={Mail}
            autoComplete="email"
            placeholder={a.emailPlaceholder}
            defaultValue={state.email}
          />
          <FormMessages error={state.error} notice={state.notice} />
          <SubmitButton intent="request" pending={pending} pendingLabel={p.sending}>
            {p.sendCode}
          </SubmitButton>
          <Link
            href="/login"
            className="mt-1 inline-flex items-center justify-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {p.backToSignIn}
          </Link>
        </>
      )}

      {state.step === "code" && (
        <>
          <FormMessages error={state.error} notice={state.notice} />
          <CodeStep email={state.email} pending={pending} submitLabel={p.continue} />
        </>
      )}

      {state.step === "password" && (
        <>
          <input type="hidden" name="email" value={state.email} />
          <PasswordField
            id="password"
            label={p.newPassword}
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            placeholder={fmt(a.passwordHint, { n: MIN_PASSWORD_LENGTH })}
            autoFocus
          />
          <PasswordField
            id="confirm_password"
            label={p.confirmNewPassword}
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
          />
          <FormMessages error={state.error} notice={state.notice} />
          <SubmitButton intent="set_password" pending={pending} pendingLabel={p.saving}>
            {p.save}
          </SubmitButton>
        </>
      )}
    </form>
  );
}
