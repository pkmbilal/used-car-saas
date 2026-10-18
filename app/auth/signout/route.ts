import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// An optional "next" field picks where to land (the admin panel sends its
// own sign-in page).
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const form = await request.formData().catch(() => null);
  const next = safeNext(form?.get("next"));
  return NextResponse.redirect(new URL(next, request.url), { status: 303 });
}
