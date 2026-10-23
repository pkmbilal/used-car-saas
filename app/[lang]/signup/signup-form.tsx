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
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-validation";
import { signupAction, type SignupState } from "./actions";

const initialState: SignupState = { step: "details", email: "" };

export function SignupForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signupAction, initialState);
  const loginHref = next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      {state.step === "details" ? (
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
          <PasswordField
            id="password"
            label="Password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          />
          <PasswordField
            id="confirm_password"
            label="Confirm password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
          />
          <FormMessages error={state.error} notice={state.notice} />
          <SubmitButton intent="register" pending={pending} pendingLabel="Creating account…">
            Create account
          </SubmitButton>
          <p className="text-center text-xs text-zinc-500">
            By creating an account you agree to our{" "}
            <Link href="/terms" className="font-medium text-ink underline underline-offset-2">
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-medium text-ink underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </p>
          <p className="mt-1 border-t border-line pt-5 text-center text-sm text-zinc-600">
            Already have an account?{" "}
            <Link href={loginHref} className={authLinkClass}>
              Sign in
            </Link>
          </p>
        </>
      ) : (
        <>
          <FormMessages error={state.error} notice={state.notice} />
          <CodeStep email={state.email} pending={pending} submitLabel="Confirm account" />
        </>
      )}
    </form>
  );
}
