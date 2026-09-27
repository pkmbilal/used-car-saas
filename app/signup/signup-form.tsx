"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CodeStep, Field, FormMessages, primaryButtonClass } from "@/components/auth-fields";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-validation";
import { signupAction, type SignupState } from "./actions";

const initialState: SignupState = { step: "details", email: "" };

export function SignupForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signupAction, initialState);
  const loginHref = next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="next" value={next} />

      {state.step === "details" ? (
        <>
          <Field
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            defaultValue={state.email}
          />
          <Field
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
          />
          <Field
            id="confirm_password"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
          />
          <FormMessages error={state.error} notice={state.notice} />
          <button type="submit" name="intent" value="register" disabled={pending} className={primaryButtonClass}>
            {pending ? "Creating account…" : "Create account"}
          </button>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Already have an account?{" "}
            <Link href={loginHref} className="font-medium underline">
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
