"use client";

import { useActionState } from "react";
import { CITIES } from "@/lib/cities";
import { capitalize, CONDITIONS, FUEL_TYPES } from "@/lib/listing-options";
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
  const maxYear = new Date().getFullYear() + 1;

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <MakeModelFields make={listing?.make} model={listing?.model} />
      <Field id="year" label="Year">
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
      <Field id="mileage" label="Mileage (km)">
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
      <Field id="price" label="Price (SAR)">
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
      <Field id="city" label="City">
        <Select id="city" options={CITIES} defaultValue={listing?.city} placeholder="Choose a city" />
      </Field>
      <Field id="condition" label="Condition">
        <Select
          id="condition"
          options={CONDITIONS}
          defaultValue={listing?.condition}
          placeholder="Choose the condition"
          format={capitalize}
        />
      </Field>
      <Field id="fuel_type" label="Fuel type">
        <Select
          id="fuel_type"
          options={FUEL_TYPES}
          defaultValue={listing?.fuel_type}
          placeholder="Choose the fuel type"
          format={capitalize}
        />
      </Field>

      <div className="flex items-center gap-4 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.saved && <p className="text-sm text-green-700">Saved.</p>}
      </div>
    </form>
  );
}
