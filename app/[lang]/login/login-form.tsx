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
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = { step: "credentials", email: "" };

function withNext(path: string, next: string) {
  return next === "/" ? path : `${path}?next=${encodeURIComponent(next)}`;
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const { t } = useDictionary();
  const a = t.authPages;
  const p = a.login;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      {state.step === "credentials" ? (
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
            autoComplete="current-password"
            aside={
              <Link href={withNext("/forgot-password", next)} className={`text-caption ${authLinkClass}`}>
                {p.forgot}
              </Link>
            }
          />
          <FormMessages error={state.error} notice={state.notice} />
          <SubmitButton intent="signin" pending={pending} pendingLabel={p.signingIn}>
            {p.signIn}
          </SubmitButton>
          <p className="mt-2 border-t border-line pt-5 text-center text-sm text-zinc-600">
            {p.newHere}{" "}
            <Link href={withNext("/signup", next)} className={authLinkClass}>
              {p.createAccount}
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
