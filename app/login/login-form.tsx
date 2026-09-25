"use client";

import { useActionState } from "react";
import { sendOtp, verifyOtp, type LoginState } from "./actions";

const initialState: LoginState = { step: "email", email: "" };

export function LoginForm({ next }: { next: string }) {
  const [emailState, sendAction, sending] = useActionState(sendOtp, initialState);
  const [codeState, verifyAction, verifying] = useActionState(verifyOtp, initialState);

  if (emailState.step === "email") {
    return (
      <form action={sendAction} className="flex flex-col gap-3">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={emailState.email}
          className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        {emailState.error && <p className="text-sm text-red-600">{emailState.error}</p>}
        <button
          type="submit"
          disabled={sending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {sending ? "Sending…" : "Send code"}
        </button>
      </form>
    );
  }

  return (
    <form action={verifyAction} className="flex flex-col gap-3">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        We sent a 6-digit code to <strong>{emailState.email}</strong>.
      </p>
      <input type="hidden" name="email" value={emailState.email} />
      <input type="hidden" name="next" value={next} />
      <label htmlFor="token" className="text-sm font-medium">
        Code
      </label>
      <input
        id="token"
        name="token"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        required
        autoFocus
        className="rounded-md border border-zinc-300 px-3 py-2 tracking-[0.5em] dark:border-zinc-700 dark:bg-zinc-900"
      />
      {codeState.error && <p className="text-sm text-red-600">{codeState.error}</p>}
      <button
        type="submit"
        disabled={verifying}
        className="rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {verifying ? "Verifying…" : "Sign in"}
      </button>
    </form>
  );
}
