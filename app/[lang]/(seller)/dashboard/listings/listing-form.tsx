"use client";

import { useActionState, useState } from "react";
import { AlertCircle, CalendarClock, Check, CheckCircle2, Construction, Loader2, Tag } from "lucide-react";
import { useDictionary } from "@/components/i18n-provider";
import { CITIES } from "@/lib/cities";
import { cityName, fmt, optionLabel, translateMessage } from "@/lib/dictionary";
import {
  BODY_TYPES,
  CONDITIONS,
  FEATURES,
  FUEL_TYPES,
  MAX_COLOR_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  TRANSMISSIONS,
} from "@/lib/listing-options";
import type { EquipmentInput, ListingInput, RentalInput } from "@/lib/listings";
import type { ListingFormState } from "./actions";
import { EquipmentFields } from "./equipment-fields";
import { Field, inputClass, Section, selectClass } from "./form-fields";
import { ListingPreview, previewFromForm, previewFromListing } from "./listing-preview";
import { MakeModelFields } from "./make-model-fields";

// What the seller is listing: a car for sale, a car for rent, or equipment
// (always for rent). Sent as listing_type + category.
export type ListingKind = "sale" | "rent" | "equipment";

type Props = {
  listing?: ListingInput & Partial<RentalInput> & Partial<EquipmentInput>;
  // For new listings: preselects the kind (e.g. from ?type=rent&category=equipment).
  defaultKind?: ListingKind;
  // The first photo, for the preview. New listings have none yet.
  cover?: string;
  action: (prev: ListingFormState, formData: FormData) => Promise<ListingFormState>;
  submitLabel: string;
};

function Select({
  id,
  options,
  defaultValue,
  placeholder,
  format = (value) => value,
}: {
  id: string;
  options: readonly string[];
  defaultValue?: string;
  placeholder: string;
  format?: (value: string) => string;
}) {
  return (
    <select id={id} name={id} required defaultValue={defaultValue ?? ""} className={selectClass}>
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option} value={option}>
          {format(option)}
        </option>
      ))}
    </select>
  );
}

function RiyalSymbol() {
  return (
    <span
      aria-hidden
      className="inline-block h-[0.85em] w-[0.76em] bg-current [mask:url(/riyal-symbol.png)_center/contain_no-repeat]"
    />
  );
}

function kindOf(listing: Props["listing"]): ListingKind | null {
  if (!listing) return null;
  if (listing.category === "equipment") return "equipment";
  return listing.listing_type === "rent" ? "rent" : "sale";
}

export function ListingForm({ listing, cover, action, submitLabel, defaultKind = "sale" }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const [preview, setPreview] = useState(() => previewFromListing(listing));
  const [kind, setKind] = useState<ListingKind>(kindOf(listing) ?? defaultKind);
  const { t } = useDictionary();
  const f = t.dashboard.form;
  const s = f.sections;
  const r = t.rentals;
  const isEquipment = kind === "equipment";
  const isRent = kind !== "sale";
  // A listing can't switch between car and equipment once created.
  const kinds = (
    [
      { value: "sale", label: r.sellOption, hint: r.sellHint, Icon: Tag },
      { value: "rent", label: r.rentOption, hint: r.rentHint, Icon: CalendarClock },
      { value: "equipment", label: t.equipment.rentOption, hint: t.equipment.rentHint, Icon: Construction },
    ] as const
  ).filter(({ value }) => !listing || (value === "equipment") === (listing.category === "equipment"));
  const maxYear = new Date().getFullYear() + 1;

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
      <form
        action={formAction}
        // Inputs stay uncontrolled; the preview re-reads the form on every
        // change. A frame later, so MakeModelFields has cleared the model when
        // the make changes.
        onChange={(event) => {
          const form = event.currentTarget;
          requestAnimationFrame(() => setPreview(previewFromForm(form)));
        }}
        className="flex flex-col gap-5"
      >
        <fieldset className="rounded-2xl border border-line bg-white p-5 shadow-[0_2px_10px_rgba(20,30,25,.05)] sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <legend className="sr-only">{r.typeTitle}</legend>
          <p className="font-semibold tracking-tight" aria-hidden>
            {r.typeTitle}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{r.typeSubtitle}</p>
          <input type="hidden" name="listing_type" value={isRent ? "rent" : "sale"} />
          <input type="hidden" name="category" value={isEquipment ? "equipment" : "car"} />
          <div className={`mt-4 grid gap-3 ${kinds.length === 3 ? "sm:grid-cols-3" : kinds.length === 2 ? "sm:grid-cols-2" : ""}`}>
            {kinds.map(({ value, label, hint, Icon }) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 shadow-sm transition select-none hover:border-forest/30 has-[:checked]:border-brand has-[:checked]:bg-forest/5 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900 dark:has-[:checked]:border-lime dark:has-[:checked]:bg-lime/10"
              >
                <input
                  type="radio"
                  name="kind"
                  value={value}
                  checked={kind === value}
                  onChange={() => setKind(value)}
                  className="sr-only"
                />
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mint text-forest dark:bg-zinc-800 dark:text-lime">
                  <Icon className="size-4.5" aria-hidden />
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {isEquipment ? (
          // Keyed so switching kinds remounts fresh, uncontrolled inputs.
          <EquipmentFields key="equipment" listing={listing} />
        ) : (
        <>
        <Section step={1} title={s.car.title} subtitle={s.car.subtitle}>
          <MakeModelFields make={listing?.make} model={listing?.model} />
          <Field id="year" label={f.year}>
            <input
              id="year"
              name="year"
              type="number"
              inputMode="numeric"
              required
              min={1950}
              max={maxYear}
              defaultValue={listing?.year}
              className={inputClass}
            />
          </Field>
          <Field id="body_type" label={f.bodyStyle}>
            <Select
              id="body_type"
              options={BODY_TYPES}
              defaultValue={listing?.body_type ?? undefined}
              placeholder={f.chooseBody}
              format={(value) => optionLabel(t.options.bodyType, value)}
            />
          </Field>
        </Section>

        <Section step={2} title={s.specs.title} subtitle={s.specs.subtitle}>
          <Field id="mileage" label={f.mileage} suffix={f.km}>
            <input
              id="mileage"
              name="mileage"
              type="number"
              inputMode="numeric"
              required
              min={0}
              defaultValue={listing?.mileage ?? undefined}
              className={`${inputClass} pe-12`}
            />
          </Field>
          <Field id="condition" label={f.condition}>
            <Select
              id="condition"
              options={CONDITIONS}
              defaultValue={listing?.condition}
              placeholder={f.chooseCondition}
              format={(value) => optionLabel(t.options.condition, value)}
            />
          </Field>
          <Field id="fuel_type" label={f.fuelType}>
            <Select
              id="fuel_type"
              options={FUEL_TYPES}
              defaultValue={listing?.fuel_type}
              placeholder={f.chooseFuel}
              format={(value) => optionLabel(t.options.fuel, value)}
            />
          </Field>
          <Field id="transmission" label={f.transmission}>
            <Select
              id="transmission"
              options={TRANSMISSIONS}
              defaultValue={listing?.transmission ?? undefined}
              placeholder={f.chooseTransmission}
              format={(value) => optionLabel(t.options.transmission, value)}
            />
          </Field>
          <Field id="color" label={f.color}>
            <input
              id="color"
              name="color"
              maxLength={MAX_COLOR_LENGTH}
              placeholder={f.colorPlaceholder}
              defaultValue={listing?.color ?? undefined}
              className={inputClass}
            />
          </Field>
        </Section>
        </>
        )}

        <Section step={3} title={s.price.title} subtitle={s.price.subtitle}>
          <Field id="price" label={isRent ? r.dailyRate : f.price} suffix={<RiyalSymbol />}>
            <input
              id="price"
              name="price"
              type="number"
              inputMode="numeric"
              required
              min={1}
              defaultValue={listing?.price}
              className={`${inputClass} pe-12 text-lg font-semibold`}
            />
          </Field>
          <Field id="city" label={f.city}>
            <Select
              id="city"
              options={CITIES}
              defaultValue={listing?.city}
              placeholder={f.chooseCity}
              format={(city) => cityName(t, city)}
            />
          </Field>
          {isRent && (
            <>
              <Field id="weekly_price" label={r.weeklyRate} hint={r.weeklyHint} suffix={<RiyalSymbol />}>
                <input
                  id="weekly_price"
                  name="weekly_price"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  defaultValue={listing?.weekly_price ?? undefined}
                  className={`${inputClass} pe-12`}
                />
              </Field>
              <Field id="monthly_price" label={r.monthlyRate} hint={r.monthlyHint} suffix={<RiyalSymbol />}>
                <input
                  id="monthly_price"
                  name="monthly_price"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  defaultValue={listing?.monthly_price ?? undefined}
                  className={`${inputClass} pe-12`}
                />
              </Field>
            </>
          )}
        </Section>

        {isRent && (
          <Section step={4} title={r.termsTitle} subtitle={r.termsSubtitle}>
            <Field id="min_rental_days" label={r.minDays}>
              <input
                id="min_rental_days"
                name="min_rental_days"
                type="number"
                inputMode="numeric"
                required
                min={1}
                max={90}
                defaultValue={listing?.min_rental_days ?? 1}
                className={inputClass}
              />
            </Field>
            <Field id="deposit" label={r.deposit} suffix={<RiyalSymbol />}>
              <input
                id="deposit"
                name="deposit"
                type="number"
                inputMode="numeric"
                min={0}
                defaultValue={listing?.deposit ?? undefined}
                className={`${inputClass} pe-12`}
              />
            </Field>
            {!isEquipment && (
            <Field id="daily_km_limit" label={r.kmLimit} hint={r.kmLimitHint} suffix={f.km}>
              <input
                id="daily_km_limit"
                name="daily_km_limit"
                type="number"
                inputMode="numeric"
                min={1}
                max={10000}
                defaultValue={listing?.daily_km_limit ?? undefined}
                className={`${inputClass} pe-12`}
              />
            </Field>
            )}
          </Section>
        )}

        <Section step={isRent ? 5 : 4} title={s.details.title} subtitle={s.details.subtitle}>
          <div className="sm:col-span-2">
            <Field
              id="description"
              label={f.description}
              hint={
                <span className="block text-end tabular-nums">
                  {fmt(f.charsCount, { count: preview.description.length, max: MAX_DESCRIPTION_LENGTH })}
                </span>
              }
            >
              <textarea
                id="description"
                name="description"
                rows={5}
                maxLength={MAX_DESCRIPTION_LENGTH}
                placeholder={f.descriptionPlaceholder}
                defaultValue={listing?.description ?? undefined}
                className={`${inputClass} resize-y leading-relaxed`}
              />
            </Field>
          </div>
          {!isEquipment && (
          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{f.features}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {FEATURES.map(({ value }) => (
                <label
                  key={value}
                  className="group inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-2 text-sm text-zinc-700 shadow-sm transition select-none hover:border-forest/30 has-[:checked]:border-brand has-[:checked]:bg-forest/5 has-[:checked]:text-forest has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:has-[:checked]:border-lime dark:has-[:checked]:bg-lime/10 dark:has-[:checked]:text-lime"
                >
                  <input
                    type="checkbox"
                    name="features"
                    value={value}
                    defaultChecked={listing?.features.includes(value)}
                    className="sr-only"
                  />
                  <Check
                    className="-ms-0.5 hidden size-3.5 group-has-[:checked]:block"
                    strokeWidth={3}
                    aria-hidden
                  />
                  {optionLabel(t.options.features, value)}
                </label>
              ))}
            </div>
          </fieldset>
          )}
        </Section>

        <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-white/85 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none dark:border-zinc-800 dark:bg-zinc-950/85 sm:dark:bg-transparent">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-brand to-forest px-6 text-sm font-semibold text-white shadow-md shadow-forest/25 transition-all hover:shadow-lg hover:shadow-forest/30 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60 max-sm:flex-1 motion-safe:hover:-translate-y-px dark:focus-visible:ring-offset-zinc-950"
          >
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {pending ? t.common.saving : submitLabel}
          </button>
          {state.error && (
            <p className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              <AlertCircle className="size-4 shrink-0" aria-hidden />
              {translateMessage(t, state.error)}
            </p>
          )}
          {state.saved && (
            <p className="inline-flex items-center gap-1.5 rounded-lg bg-forest/5 px-3 py-2 text-sm text-forest dark:bg-lime/10 dark:text-lime">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden />
              {t.account.saved}
            </p>
          )}
        </div>
      </form>

      <aside className="hidden lg:sticky lg:top-24 lg:block">
        <ListingPreview data={preview} cover={cover} rent={isRent} equipment={isEquipment} />
      </aside>
    </div>
  );
}
