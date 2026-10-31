"use client";

import { useDictionary } from "@/components/i18n-provider";
import { optionLabel } from "@/lib/dictionary";
import {
  EQUIPMENT_BRANDS,
  EQUIPMENT_TYPES,
  equipmentBrandName,
  equipmentTypeName,
} from "@/lib/equipment";
import { CONDITIONS, FUEL_TYPES } from "@/lib/listing-options";
import type { EquipmentInput, ListingInput } from "@/lib/listings";
import { Field, inputClass, Section, selectClass } from "./form-fields";

function Select({
  id,
  name = id,
  options,
  defaultValue,
  placeholder,
  format,
}: {
  id: string;
  name?: string;
  options: readonly string[];
  defaultValue?: string;
  placeholder: string;
  format: (value: string) => string;
}) {
  return (
    <select id={id} name={name} required defaultValue={defaultValue ?? ""} className={selectClass}>
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

// Steps 1–2 of the listing form for equipment rentals. The brand is sent as
// `make`, like a car's make.
export function EquipmentFields({ listing }: { listing?: ListingInput & Partial<EquipmentInput> }) {
  const { t, locale } = useDictionary();
  const f = t.dashboard.form;
  const e = t.equipment;
  const maxYear = new Date().getFullYear() + 1;

  return (
    <>
      <Section step={1} title={e.detailsTitle} subtitle={e.detailsSubtitle}>
        <Field id="equipment_type" label={e.type}>
          <Select
            id="equipment_type"
            options={EQUIPMENT_TYPES}
            defaultValue={listing?.equipment_type ?? undefined}
            placeholder={e.chooseType}
            format={(value) => equipmentTypeName(locale, value)}
          />
        </Field>
        <Field id="equipment_brand" label={e.brand}>
          <Select
            id="equipment_brand"
            name="make"
            options={EQUIPMENT_BRANDS}
            defaultValue={listing?.make}
            placeholder={e.chooseBrand}
            format={(value) => equipmentBrandName(locale, value)}
          />
        </Field>
        <Field id="model" label={f.model}>
          <input
            id="model"
            name="model"
            required
            maxLength={60}
            placeholder="320D, 3CX, 8FD25…"
            defaultValue={listing?.model}
            className={inputClass}
          />
        </Field>
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
      </Section>

      <Section step={2} title={t.dashboard.form.sections.specs.title} subtitle={e.detailsSubtitle}>
        <Field id="operating_hours" label={e.hoursOptional} hint={e.hoursHint}>
          <input
            id="operating_hours"
            name="operating_hours"
            type="number"
            inputMode="numeric"
            min={0}
            defaultValue={listing?.operating_hours ?? undefined}
            className={inputClass}
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
        <label className="flex cursor-pointer items-start gap-3 self-end rounded-xl border border-line bg-white px-4 py-3 shadow-sm select-none has-[:checked]:border-brand has-[:checked]:bg-forest/5 dark:border-zinc-700 dark:bg-zinc-900 dark:has-[:checked]:border-lime dark:has-[:checked]:bg-lime/10">
          <input
            type="checkbox"
            name="operator_included"
            defaultChecked={listing?.operator_included ?? false}
            className="mt-0.5 size-4 accent-brand"
          />
          <span className="flex flex-col">
            <span className="text-sm font-semibold">{e.operatorIncluded}</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{e.operatorHint}</span>
          </span>
        </label>
      </Section>
    </>
  );
}
