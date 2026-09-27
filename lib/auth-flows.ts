import "server-only";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// State shared by the multi-step auth forms (sign in, sign up, reset).
export type AuthFlowState<Step extends string> = {
  step: Step;
  email: string;
  error?: string;
  notice?: string;
};

export function describeAuthError(error: AuthError, fallback: string): string {
  switch (error.code) {
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Wait a few minutes and try again.";
    case "weak_password":
      return "Choose a stronger password (at least 8 characters).";
    case "otp_expired":
      return "That code is invalid or has expired.";
    case "same_password":
      return "Choose a password different from your current one.";
    default:
      return fallback;
  }
}

// Returns an error message, or undefined on success.
export async function resendSignupCode(email: string): Promise<string | undefined> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email });
  return error ? describeAuthError(error, "Could not send a new code. Try again.") : undefined;
}

// Confirms a new account with the emailed code and signs the user in.
export async function confirmSignup(email: string, code: string): Promise<string | undefined> {
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "signup" });
  return error ? describeAuthError(error, "That code is invalid or has expired.") : undefined;
}
