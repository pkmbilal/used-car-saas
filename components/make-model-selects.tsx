"use client";

import { useState } from "react";
import { FormSelect } from "@/components/form-select";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MAKES, modelsFor } from "@/lib/makes";
import { cn } from "@/lib/utils";

const triggerClass = "h-9 w-full bg-white text-xs data-[size=default]:h-9 max-sm:text-sm max-sm:data-[size=default]:h-10";

// Make and Model filters for GET search forms. Model choices follow the
// selected make, and the model resets to "Any" when the make changes.
export function MakeModelSelects({
  make: initialMake,
  model: initialModel,
  makeId,
  modelId,
  makePlaceholder,
  modelPlaceholder,
  fieldClassName,
  labelClassName,
  triggerClassName,
  makeLabel = "Make",
  modelLabel = "Model",
}: {
  make?: string;
  model?: string;
  makeId: string;
  modelId: string;
  makePlaceholder: string;
  modelPlaceholder: string;
  fieldClassName: string;
  labelClassName: string;
  triggerClassName?: string;
  makeLabel?: React.ReactNode;
  modelLabel?: React.ReactNode;
}) {
  const [make, setMake] = useState(initialMake);
  const models = make ? modelsFor(make) : [];

  return (
    <>
      <div className={fieldClassName}>
        <Label htmlFor={makeId} className={labelClassName}>
          {makeLabel}
        </Label>
        <FormSelect
          id={makeId}
          name="make"
          defaultValue={initialMake}
          placeholder={makePlaceholder}
          options={MAKES.map((option) => ({ value: option, label: option }))}
          onValueChange={setMake}
          className={triggerClassName}
        />
      </div>
      <div className={fieldClassName}>
        <Label htmlFor={modelId} className={labelClassName}>
          {modelLabel}
        </Label>
        {models.length > 0 ? (
          <FormSelect
            key={make}
            id={modelId}
            name="model"
            defaultValue={make === initialMake ? initialModel : undefined}
            placeholder={modelPlaceholder}
            options={models.map((option) => ({ value: option, label: option }))}
            className={triggerClassName}
          />
        ) : (
          <Select disabled>
            <SelectTrigger id={modelId} className={cn(triggerClass, triggerClassName)}>
              <SelectValue placeholder={make ? modelPlaceholder : "Choose a make first"} />
            </SelectTrigger>
          </Select>
        )}
      </div>
    </>
  );
}
