"use server";

import { redirect } from "next/navigation";
import { safeNext } from "@/lib/auth";
import { describeAuthError, type AuthFlowState } from "@/lib/auth-flows";
import {
  isValidEmail,
  isValidPassword,
  normalizeEmail,
  parseCode,
} from "@/lib/auth-validation";
import { createClient } from "@/lib/supabase/server";

export type ResetState = AuthFlowState<"email" | "code" | "password">;

const CODE_SENT = "If an account exists for this email, we've sent it a code.";

async function sendResetCode(email: string): Promise<ResetState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  // Don't reveal whether the email is registered; only surface rate limits.
  if (error && error.code?.startsWith("over_")) {
    return { step: "code", email, error: describeAuthError(error, "Try again later.") };
  }
  return { step: "code", email, notice: CODE_SENT };
}

export async function resetAction(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const email = normalizeEmail(formData.get("email"));

  switch (formData.get("intent")) {
    case "back":
      return { step: "email", email };

    case "resend":
      return sendResetCode(email);

    case "verify": {
      const code = parseCode(formData.get("code"));
      if (!code) return { step: "code", email, error: "Enter the 6-digit code from the email." };

      // A valid recovery code signs the user in so they can set a password.
      const supabase = await createClient();
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "recovery" });
      if (error) {
        return {
          step: "code",
          email,
          error: describeAuthError(error, "That code is invalid or has expired."),
        };
      }
      return { step: "password", email };
    }

    case "set_password": {
      const password = String(formData.get("password") ?? "");
      if (!isValidPassword(password)) {
        return { step: "password", email, error: "Use at least 8 characters for your password." };
      }
      if (password !== formData.get("confirm_password")) {
        return { step: "password", email, error: "The passwords don't match." };
      }

      const supabase = await createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        return {
          step: "password",
          email,
          error: describeAuthError(error, "Could not update your password. Start again."),
        };
      }
      redirect(safeNext(formData.get("next")));
    }

    default:
      if (!isValidEmail(email)) return { step: "email", email, error: "Enter a valid email address." };
      return sendResetCode(email);
  }
}
