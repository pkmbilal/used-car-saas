"use client";

import { useActionState } from "react";
import { useDictionary } from "@/components/i18n-provider";
import { CITIES } from "@/lib/cities";
import { cityName, optionLabel, translateMessage } from "@/lib/dictionary";
import {
  BODY_TYPES,
  CONDITIONS,
  FEATURES,
  FUEL_TYPES,
  MAX_COLOR_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  TRANSMISSIONS,
} from "@/lib/listing-options";
import type { ListingInput } from "@/lib/listings";
import type { ListingFormState } from "./actions";
import { Field, inputClass } from "./form-fields";
import { MakeModelFields } from "./make-model-fields";

type Props = {
  listing?: ListingInput;
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
    <select id={id} name={id} required defaultValue={defaultValue ?? ""} className={inputClass}>
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

export function ListingForm({ listing, action, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const { t } = useDictionary();
  const f = t.dashboard.form;
  const maxYear = new Date().getFullYear() + 1;

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <MakeModelFields make={listing?.make} model={listing?.model} />
      <Field id="year" label={f.year}>
        <input
          id="year"
          name="year"
          type="number"
          required
          min={1950}
          max={maxYear}
          defaultValue={listing?.year}
          className={inputClass}
        />
      </Field>
      <Field id="mileage" label={f.mileage}>
        <input
          id="mileage"
          name="mileage"
          type="number"
          required
          min={0}
          defaultValue={listing?.mileage}
          className={inputClass}
        />
      </Field>
      <Field id="price" label={f.price}>
        <input
          id="price"
          name="price"
          type="number"
          required
          min={1}
          defaultValue={listing?.price}
          className={inputClass}
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
      <Field id="body_type" label={f.bodyStyle}>
        <Select
          id="body_type"
          options={BODY_TYPES}
          defaultValue={listing?.body_type ?? undefined}
          placeholder={f.chooseBody}
          format={(value) => optionLabel(t.options.bodyType, value)}
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
      <div className="sm:col-span-2">
        <Field id="description" label={f.description}>
          <textarea
            id="description"
            name="description"
            rows={5}
            maxLength={MAX_DESCRIPTION_LENGTH}
            placeholder={f.descriptionPlaceholder}
            defaultValue={listing?.description ?? undefined}
            className={inputClass}
          />
        </Field>
      </div>
      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-medium">{f.features}</legend>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
          {FEATURES.map(({ value }) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="features"
                value={value}
                defaultChecked={listing?.features.includes(value)}
              />
              {optionLabel(t.options.features, value)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center gap-4 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? t.common.saving : submitLabel}
        </button>
        {state.error && <p className="text-sm text-red-600">{translateMessage(t, state.error)}</p>}
        {state.saved && <p className="text-sm text-green-700">{t.account.saved}</p>}
      </div>
    </form>
  );
}
