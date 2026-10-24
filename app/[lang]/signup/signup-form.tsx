"use client";

import Link from "@/components/locale-link";
import { useActionState } from "react";
import { Mail } from "lucide-react";
import {
  authLinkClass,
  CodeStep,
  Field,
  FormMessages,
  PasswordField,
  SubmitButton,
} from "@/components/auth-fields";
import { useDictionary } from "@/components/i18n-provider";
import { rich } from "@/components/rich-text";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-validation";
import { fmt } from "@/lib/dictionary";
import { signupAction, type SignupState } from "./actions";

const initialState: SignupState = { step: "details", email: "" };

export function SignupForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signupAction, initialState);
  const { t } = useDictionary();
  const a = t.authPages;
  const p = a.signup;
  const loginHref = next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      {state.step === "details" ? (
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
          <PasswordField
            id="password"
            label={a.password}
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            placeholder={fmt(a.passwordHint, { n: MIN_PASSWORD_LENGTH })}
          />
          <PasswordField
            id="confirm_password"
            label={p.confirmPassword}
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
          />
          <FormMessages error={state.error} notice={state.notice} />
          <SubmitButton intent="register" pending={pending} pendingLabel={p.creating}>
            {p.create}
          </SubmitButton>
          <p className="text-center text-xs text-zinc-500">
            {rich(p.agree, {
              terms: (
                <Link href="/terms" className="font-medium text-ink underline underline-offset-2">
                  {p.terms}
                </Link>
              ),
              privacy: (
                <Link href="/privacy" className="font-medium text-ink underline underline-offset-2">
                  {p.privacy}
                </Link>
              ),
            })}
          </p>
          <p className="mt-1 border-t border-line pt-5 text-center text-sm text-zinc-600">
            {p.haveAccount}{" "}
            <Link href={loginHref} className={authLinkClass}>
              {p.signIn}
            </Link>
          </p>
        </>
      ) : (
        <>
          <FormMessages error={state.error} notice={state.notice} />
          <CodeStep email={state.email} pending={pending} submitLabel={p.confirm} />
        </>
      )}
    </form>
  );
}
