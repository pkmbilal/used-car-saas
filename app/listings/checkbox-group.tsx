"use client";

import { useState } from "react";

export type CheckboxOption = { value: string; label: string; count?: number };

// A multi-select filter for the GET form. The ticked values travel as one
// comma-separated param, left out entirely when nothing is ticked.
export function CheckboxGroup({
  idPrefix,
  title,
  name,
  options,
  selected,
  legendClassName,
}: {
  idPrefix: string;
  title: string;
  name: string;
  options: CheckboxOption[];
  selected: readonly string[];
  legendClassName: string;
}) {
  const [checked, setChecked] = useState<string[]>([...selected]);

  function toggle(value: string) {
    setChecked((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  return (
    <fieldset className="flex flex-col">
      <legend className={`${legendClassName} mb-2`}>{title}</legend>
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const id = `${idPrefix}-${name}-${option.value}`;
          return (
            <label key={option.value} htmlFor={id} className="flex cursor-pointer items-center gap-2 text-xs text-ink/80">
              <input
                id={id}
                type="checkbox"
                checked={checked.includes(option.value)}
                onChange={() => toggle(option.value)}
                className="size-3.5 accent-brand"
              />
              {option.label}
              {option.count !== undefined && (
                <span className="text-[10px] text-muted-foreground">({option.count})</span>
              )}
            </label>
          );
        })}
      </div>
      {checked.length > 0 && <input type="hidden" name={name} value={checked.join(",")} />}
    </fieldset>
  );
}
