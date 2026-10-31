"use client";

import { useState } from "react";
import { useDictionary } from "@/components/i18n-provider";
import { filterTriggerClass, SearchableSelect } from "@/components/searchable-select";
import { Label } from "@/components/ui/label";
import { makeName, modelName } from "@/lib/car-names";
import { MAKES, modelsFor } from "@/lib/makes";
import { cn } from "@/lib/utils";

// Make and Model filters for GET search forms. Both dropdowns can be searched
// by typing. Model choices follow the selected make, and the model resets to
// "Any" when the make changes. "Any" submits nothing, so URLs stay clean.
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
  makeLabel,
  modelLabel,
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
  const { t, locale } = useDictionary();
  const [make, setMake] = useState(initialMake ?? "");
  const [model, setModel] = useState(initialModel ?? "");
  const models = make ? modelsFor(make) : [];
  const trigger = cn(filterTriggerClass, triggerClassName);

  return (
    <>
      <div className={fieldClassName}>
        <Label htmlFor={makeId} className={labelClassName}>
          {makeLabel ?? t.select.make}
        </Label>
        <SearchableSelect
          id={makeId}
          name="make"
          value={make}
          onValueChange={(next) => {
            if (next !== make) setModel("");
            setMake(next);
          }}
          placeholder={makePlaceholder}
          searchPlaceholder={t.select.searchMakes}
          emptyText={t.select.noMatches}
          options={[
            { value: "", label: makePlaceholder },
            ...MAKES.map((option) => ({ value: option, label: makeName(locale, option) })),
          ]}
          triggerClassName={trigger}
        />
      </div>
      <div className={fieldClassName}>
        <Label htmlFor={modelId} className={labelClassName}>
          {modelLabel ?? t.select.model}
        </Label>
        <SearchableSelect
          id={modelId}
          name="model"
          value={models.length > 0 ? model : ""}
          onValueChange={setModel}
          disabled={models.length === 0}
          placeholder={make ? modelPlaceholder : t.select.chooseMakeFirst}
          searchPlaceholder={t.select.searchModels}
          emptyText={t.select.noMatches}
          options={[
            { value: "", label: modelPlaceholder },
            ...models.map((option) => ({ value: option, label: modelName(locale, make, option) })),
          ]}
          triggerClassName={trigger}
        />
      </div>
    </>
  );
}
