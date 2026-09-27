"use server";

import { redirect } from "next/navigation";
import { safeNext } from "@/lib/auth";
import {
  confirmSignup,
  describeAuthError,
  resendSignupCode,
  type AuthFlowState,
} from "@/lib/auth-flows";
import { isValidEmail, normalizeEmail, parseCode } from "@/lib/auth-validation";
import { createClient } from "@/lib/supabase/server";

// "code" is only used when the account exists but was never confirmed.
export type LoginState = AuthFlowState<"credentials" | "code">;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = normalizeEmail(formData.get("email"));
  const next = safeNext(formData.get("next"));

  switch (formData.get("intent")) {
    case "back":
      return { step: "credentials", email };

    case "resend": {
      const error = await resendSignupCode(email);
      return error
        ? { step: "code", email, error }
        : { step: "code", email, notice: "We sent a new code." };
    }

    case "verify": {
      const code = parseCode(formData.get("code"));
      if (!code) return { step: "code", email, error: "Enter the 6-digit code from the email." };
      const error = await confirmSignup(email, code);
      if (error) return { step: "code", email, error };
      redirect(next);
    }

    default: {
      const password = String(formData.get("password") ?? "");
      if (!isValidEmail(email) || !password) {
        return { step: "credentials", email, error: "Enter your email and password." };
      }

      const supabase = await createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) redirect(next);

      if (error.code === "email_not_confirmed") {
        const resendError = await resendSignupCode(email);
        return resendError
          ? { step: "code", email, error: resendError }
          : {
              step: "code",
              email,
              notice: "Your account isn't confirmed yet. We sent you a new code.",
            };
      }
      if (error.code === "invalid_credentials") {
        return { step: "credentials", email, error: "Incorrect email or password." };
      }
      return {
        step: "credentials",
        email,
        error: describeAuthError(error, "Could not sign you in. Try again."),
      };
    }
  }
}
