"use server";

import { redirect } from "next/navigation";
import { safeNext } from "@/lib/auth";
import {
  confirmSignup,
  describeAuthError,
  resendSignupCode,
  type AuthFlowState,
} from "@/lib/auth-flows";
import { isValidEmail, isValidPassword, normalizeEmail, parseCode } from "@/lib/auth-validation";
import { createClient } from "@/lib/supabase/server";

export type SignupState = AuthFlowState<"details" | "code">;

const CODE_SENT =
  "If this email is new, we've sent it a code. Already have an account? Sign in instead.";

// One action for the whole flow; the submit button's `intent` picks the step.
export async function signupAction(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const email = normalizeEmail(formData.get("email"));
  const next = safeNext(formData.get("next"));

  switch (formData.get("intent")) {
    case "back":
      return { step: "details", email };

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
      redirect(next === "/" ? "/account?welcome=1" : next);
    }

    default: {
      const password = String(formData.get("password") ?? "");
      if (!isValidEmail(email)) return { step: "details", email, error: "Enter a valid email address." };
      if (!isValidPassword(password)) {
        return { step: "details", email, error: "Use at least 8 characters for your password." };
      }
      if (password !== formData.get("confirm_password")) {
        return { step: "details", email, error: "The passwords don't match." };
      }

      // Supabase doesn't reveal whether the email is already registered, so
      // the code step is shown either way.
      const supabase = await createClient();
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        return {
          step: "details",
          email,
          error: describeAuthError(error, "Could not create your account. Try again."),
        };
      }
      return { step: "code", email, notice: CODE_SENT };
    }
  }
}
