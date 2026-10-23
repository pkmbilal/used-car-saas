"use client";

import { useState } from "react";
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
  const [make, setMake] = useState(initialMake ?? "");
  const known = initialModel ? findModel(make, initialModel) : undefined;
  const [selected, setSelected] = useState(known ?? (initialModel ? TYPE_MODEL : ""));
  const [typed, setTyped] = useState(known ? "" : (initialModel ?? ""));

  const models = modelsFor(make);
  const typing = make !== "" && (models.length === 0 || selected === TYPE_MODEL);

  return (
    <>
      <Field id="make" label="Make">
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
            Choose a make
          </option>
          {MAKES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>
      <Field id="model" label="Model">
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
              Choose a model
            </option>
            {models.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            <option value={TYPE_MODEL}>Other (type it)</option>
          </select>
        )}
        {make === "" && (
          <select id="model" disabled value="" className={inputClass}>
            <option value="">Choose a make first</option>
          </select>
        )}
        {typing && (
          <input
            id="model"
            name="model"
            required
            maxLength={60}
            placeholder="Type the model"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            className={inputClass}
          />
        )}
      </Field>
    </>
  );
}
