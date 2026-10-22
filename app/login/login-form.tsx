"use client";

import Link from "next/link";
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
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = { step: "credentials", email: "" };

function withNext(path: string, next: string) {
  return next === "/" ? path : `${path}?next=${encodeURIComponent(next)}`;
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      {state.step === "credentials" ? (
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
            autoComplete="current-password"
            aside={
              <Link href={withNext("/forgot-password", next)} className={`text-caption ${authLinkClass}`}>
                Forgot password?
              </Link>
            }
          />
          <FormMessages error={state.error} notice={state.notice} />
          <SubmitButton intent="signin" pending={pending} pendingLabel="Signing in…">
            Sign in
          </SubmitButton>
          <p className="mt-2 border-t border-line pt-5 text-center text-sm text-zinc-600">
            New here?{" "}
            <Link href={withNext("/signup", next)} className={authLinkClass}>
              Create an account
            </Link>
          </p>
        </>
      ) : (
        <>
          <FormMessages error={state.error} notice={state.notice} />
          <CodeStep email={state.email} pending={pending} submitLabel="Confirm and sign in" />
        </>
      )}
    </form>
  );
}
