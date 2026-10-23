"use client";

import { useActionState } from "react";
import type { Profile } from "@/lib/auth";
import {
  ABOUT_MAX,
  BUSINESS_NAME_MAX,
  SHOWROOM_ADDRESS_MAX,
} from "@/lib/storefront-options";
import { updateStorefront } from "./actions";

type Props = {
  profile: Pick<Profile, "business_name" | "about" | "showroom_address">;
};

const inputClass =
  "rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export function StorefrontForm({ profile }: Props) {
  const [state, formAction, pending] = useActionState(updateStorefront, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="business_name" className="text-sm font-medium">
          Business name
        </label>
        <input
          id="business_name"
          name="business_name"
          required
          minLength={2}
          maxLength={BUSINESS_NAME_MAX}
          autoComplete="organization"
          defaultValue={profile.business_name ?? ""}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="showroom_address" className="text-sm font-medium">
          Showroom address <span className="font-normal text-zinc-500">(optional)</span>
        </label>
        <input
          id="showroom_address"
          name="showroom_address"
          maxLength={SHOWROOM_ADDRESS_MAX}
          autoComplete="street-address"
          defaultValue={profile.showroom_address ?? ""}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="about" className="text-sm font-medium">
          About <span className="font-normal text-zinc-500">(optional)</span>
        </label>
        <textarea
          id="about"
          name="about"
          rows={6}
          maxLength={ABOUT_MAX}
          placeholder="What you sell, opening hours, warranty or financing you offer…"
          defaultValue={profile.about ?? ""}
          className={inputClass}
        />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.saved && <p className="text-sm text-green-700">Saved.</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Saving…" : "Save storefront"}
      </button>
    </form>
  );
}
