"use client";

import { useState } from "react";
import { useDictionary } from "@/components/i18n-provider";
import { SearchableSelect } from "@/components/searchable-select";
import { makeName, modelName } from "@/lib/car-names";
import { fmt } from "@/lib/dictionary";
import { MAKES, modelsFor } from "@/lib/makes";
import { Field, inputClass } from "./form-fields";

function findModel(make: string, model: string): string | undefined {
  const key = model.trim().toLowerCase();
  return modelsFor(make).find((option) => option.toLowerCase() === key);
}

// Make and model live together because the model choices depend on the make.
// Both are searchable; a model that isn't listed can be used as typed.
// `onChange` fires after a pick, since the hidden inputs don't emit change
// events for the form's live preview.
export function MakeModelFields({
  make: initialMake,
  model: initialModel,
  onChange,
}: {
  make?: string;
  model?: string;
  onChange?: () => void;
}) {
  const { t, locale } = useDictionary();
  const f = t.dashboard.form;
  const [make, setMake] = useState(initialMake ?? "");
  const [model, setModel] = useState(() =>
    initialMake && initialModel ? (findModel(initialMake, initialModel) ?? initialModel) : "",
  );

  const models = modelsFor(make);

  return (
    <>
      <Field id="make" label={f.make}>
        <SearchableSelect
          id="make"
          name="make"
          required
          value={make}
          onValueChange={(next) => {
            if (next !== make) setModel("");
            setMake(next);
            onChange?.();
          }}
          placeholder={f.chooseMake}
          searchPlaceholder={t.select.searchMakes}
          emptyText={t.select.noMatches}
          options={MAKES.map((option) => ({ value: option, label: makeName(locale, option) }))}
          triggerClassName={inputClass}
        />
      </Field>
      <Field id="model" label={f.model}>
        {make !== "" && models.length === 0 ? (
          <input
            id="model"
            name="model"
            required
            maxLength={60}
            placeholder={f.typeModel}
            value={model}
            onChange={(event) => setModel(event.target.value)}
            className={inputClass}
          />
        ) : (
          <SearchableSelect
            id="model"
            name="model"
            required
            disabled={make === ""}
            value={model}
            onValueChange={(next) => {
              setModel(next.slice(0, 60));
              onChange?.();
            }}
            placeholder={make === "" ? f.chooseMakeFirst : f.chooseModel}
            searchPlaceholder={t.select.searchModels}
            emptyText={t.select.noMatches}
            customOption={(query) => fmt(t.select.useTyped, { value: query })}
            options={models.map((option) => ({ value: option, label: modelName(locale, make, option) }))}
            triggerClassName={inputClass}
          />
        )}
      </Field>
    </>
  );
}
