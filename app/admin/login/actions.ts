"use server";

import { redirect } from "next/navigation";
import { safeNext } from "@/lib/auth";
import { describeAuthError } from "@/lib/auth-flows";
import { isValidEmail, normalizeEmail } from "@/lib/auth-validation";
import { createClient } from "@/lib/supabase/server";

export type AdminLoginState = { email: string; error?: string };

const INVALID = "Incorrect email or password.";

// Lands on the admin panel unless a specific admin page was asked for.
function adminNext(value: FormDataEntryValue | null): string {
  const next = safeNext(value);
  return next.startsWith("/admin") ? next : "/admin";
}

export async function adminLoginAction(
  _prev: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  if (!isValidEmail(email) || !password) {
    return { email, error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      email,
      error: error.code === "invalid_credentials" ? INVALID : describeAuthError(error, "Could not sign you in. Try again."),
    };
  }

  // Non-admins get the same message as a wrong password, so this page never
  // confirms which emails have admin access.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, suspended_at")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile?.is_admin || profile.suspended_at) {
    await supabase.auth.signOut();
    return { email, error: INVALID };
  }

  redirect(adminNext(formData.get("next")));
}
