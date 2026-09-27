"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CodeStep, Field, FormMessages, primaryButtonClass } from "@/components/auth-fields";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = { step: "credentials", email: "" };

function withNext(path: string, next: string) {
  return next === "/" ? path : `${path}?next=${encodeURIComponent(next)}`;
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="next" value={next} />

      {state.step === "credentials" ? (
        <>
          <Field
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            defaultValue={state.email}
          />
          <Field id="password" label="Password" type="password" autoComplete="current-password" />
          <Link
            href={withNext("/forgot-password", next)}
            className="self-end text-sm text-zinc-600 dark:text-zinc-400"
          >
            Forgot password?
          </Link>
          <FormMessages error={state.error} notice={state.notice} />
          <button type="submit" name="intent" value="signin" disabled={pending} className={primaryButtonClass}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            New here?{" "}
            <Link href={withNext("/signup", next)} className="font-medium underline">
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
