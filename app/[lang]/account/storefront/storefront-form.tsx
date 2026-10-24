"use client";

import { useActionState } from "react";
import { useDictionary } from "@/components/i18n-provider";
import type { Profile } from "@/lib/auth";
import { translateMessage } from "@/lib/dictionary";
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
  const { t } = useDictionary();
  const s = t.account.storefront;
  const optional = <span className="font-normal text-zinc-500">{t.account.optional}</span>;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="business_name" className="text-sm font-medium">
          {t.account.dealer.businessName}
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
          {t.account.dealer.showroomAddress} {optional}
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
          {s.about} {optional}
        </label>
        <textarea
          id="about"
          name="about"
          rows={6}
          maxLength={ABOUT_MAX}
          placeholder={s.aboutPlaceholder}
          defaultValue={profile.about ?? ""}
          className={inputClass}
        />
      </div>
      {state.error && <p className="text-sm text-red-600">{translateMessage(t, state.error)}</p>}
      {state.saved && <p className="text-sm text-green-700">{t.account.saved}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? t.common.saving : s.save}
      </button>
    </form>
  );
}
