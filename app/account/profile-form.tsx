"use client";

import { useActionState } from "react";
import { CITIES } from "@/lib/cities";
import type { Profile } from "@/lib/auth";
import type { ProfileFormState } from "./actions";

type Props = {
  profile: Profile;
  action: (prev: ProfileFormState, formData: FormData) => Promise<ProfileFormState>;
  submitLabel: string;
};

const inputClass =
  "rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export function ProfileForm({ profile, action, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="full_name" className="text-sm font-medium">
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          required
          autoComplete="name"
          defaultValue={profile.full_name ?? ""}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium">
          Mobile number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="05XXXXXXXX"
          defaultValue={profile.phone ?? ""}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="city" className="text-sm font-medium">
          City
        </label>
        <select
          id="city"
          name="city"
          required
          defaultValue={profile.city ?? ""}
          className={inputClass}
        >
          <option value="" disabled>
            Choose a city
          </option>
          {CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.saved && <p className="text-sm text-green-700">Saved.</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
