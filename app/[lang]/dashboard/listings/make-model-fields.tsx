"use client";

import { useState } from "react";
import { useDictionary } from "@/components/i18n-provider";
import { MAKES, modelsFor } from "@/lib/makes";
import { Field, inputClass } from "./form-fields";

const TYPE_MODEL = "__other__";

function findModel(make: string, model: string): string | undefined {
  const key = model.trim().toLowerCase();
  return modelsFor(make).find((option) => option.toLowerCase() === key);
}

// Make and model live together because the model choices depend on the make.
// Exactly one element is named "model" at a time, so FormData is unchanged.
export function MakeModelFields({
  make: initialMake,
  model: initialModel,
}: {
  make?: string;
  model?: string;
}) {
  const { t } = useDictionary();
  const f = t.dashboard.form;
  const [make, setMake] = useState(initialMake ?? "");
  const known = initialModel ? findModel(make, initialModel) : undefined;
  const [selected, setSelected] = useState(known ?? (initialModel ? TYPE_MODEL : ""));
  const [typed, setTyped] = useState(known ? "" : (initialModel ?? ""));

  const models = modelsFor(make);
  const typing = make !== "" && (models.length === 0 || selected === TYPE_MODEL);

  return (
    <>
      <Field id="make" label={f.make}>
        <select
          id="make"
          name="make"
          required
          value={make}
          onChange={(event) => {
            setMake(event.target.value);
            setSelected("");
            setTyped("");
          }}
          className={inputClass}
        >
          <option value="" disabled>
            {f.chooseMake}
          </option>
          {MAKES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>
      <Field id="model" label={f.model}>
        {models.length > 0 && (
          <select
            id={typing ? "model-choice" : "model"}
            name={typing ? undefined : "model"}
            required
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            className={inputClass}
          >
            <option value="" disabled>
              {f.chooseModel}
            </option>
            {models.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            <option value={TYPE_MODEL}>{f.otherModel}</option>
          </select>
        )}
        {make === "" && (
          <select id="model" disabled value="" className={inputClass}>
            <option value="">{f.chooseMakeFirst}</option>
          </select>
        )}
        {typing && (
          <input
            id="model"
            name="model"
            required
            maxLength={60}
            placeholder={f.typeModel}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            className={inputClass}
          />
        )}
      </Field>
    </>
  );
}
