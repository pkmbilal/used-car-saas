"use client";

import { useActionState, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, CheckCircle2, Loader2, MapPin, Phone, UserRound } from "lucide-react";
import { useDictionary } from "@/components/i18n-provider";
import { SearchableSelect } from "@/components/searchable-select";
import { CITIES } from "@/lib/cities";
import { cityName, translateMessage } from "@/lib/dictionary";
import type { Profile } from "@/lib/auth";
import type { ProfileFormState } from "./actions";

type Props = {
  profile: Profile;
  action: (prev: ProfileFormState, formData: FormData) => Promise<ProfileFormState>;
  submitLabel: string;
};

const inputClass =
  "h-11 w-full rounded-xl border border-zinc-300 bg-white ps-10 pe-3 text-base shadow-sm transition-colors outline-none placeholder:text-zinc-400 focus:border-brand focus:ring-3 focus:ring-brand/20 sm:text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-lime dark:focus:ring-lime/20";

// Same look as the inputs; the city icon sits inside the trigger instead.
const triggerClass =
  "h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-base shadow-sm transition-colors outline-none focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/20 data-[state=open]:border-brand data-[state=open]:ring-3 data-[state=open]:ring-brand/20 sm:text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:focus-visible:border-lime dark:focus-visible:ring-lime/20";

export function ProfileForm({ profile, action, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const { t } = useDictionary();
  const f = t.account.form;
  const [city, setCity] = useState(profile.city ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field id="full_name" label={f.fullName} icon={UserRound}>
        <input
          id="full_name"
          name="full_name"
          required
          autoComplete="name"
          defaultValue={profile.full_name ?? ""}
          className={inputClass}
        />
      </Field>
      <Field id="phone" label={f.mobile} icon={Phone} dir="ltr">
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          dir="ltr"
          placeholder="05XXXXXXXX"
          defaultValue={profile.phone ?? ""}
          className={inputClass}
        />
      </Field>
      <Field id="city" label={f.city}>
        <SearchableSelect
          id="city"
          name="city"
          required
          value={city}
          onValueChange={setCity}
          placeholder={f.chooseCity}
          searchPlaceholder={t.select.searchCities}
          emptyText={t.select.noMatches}
          options={CITIES.map((value) => ({ value, label: cityName(t, value) }))}
          icon={<MapPin className="size-4 shrink-0 text-zinc-400" aria-hidden />}
          triggerClassName={triggerClass}
        />
      </Field>

      {state.error && (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {translateMessage(t, state.error)}
        </p>
      )}
      {state.saved && (
        <p className="flex items-center gap-2 rounded-xl bg-mint px-3 py-2.5 text-sm text-forest dark:bg-lime/10 dark:text-lime">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          {t.account.saved}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center justify-center gap-2 self-stretch rounded-full bg-gradient-to-b from-brand to-forest px-6 text-sm font-semibold text-white shadow-md shadow-forest/25 transition-all hover:shadow-lg hover:shadow-forest/30 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60 motion-safe:hover:-translate-y-px sm:self-start dark:focus-visible:ring-offset-zinc-950"
      >
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {pending ? t.common.saving : submitLabel}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  dir,
  children,
}: {
  id: string;
  label: string;
  // Omit when the control draws its own icon.
  icon?: LucideIcon;
  // Phone numbers stay left-to-right, so their icon sits on the left too.
  dir?: "ltr";
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {label}
      </label>
      <div className="relative" dir={dir}>
        {Icon && (
          <Icon
            aria-hidden
            className="pointer-events-none absolute start-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-zinc-400"
          />
        )}
        {children}
      </div>
    </div>
  );
}
