"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Radix items can't have an empty value, so "Any" uses a sentinel.
const ANY = "any";

export type FormSelectOption = { value: string; label: string };

// A shadcn Select that submits with a plain GET form. The value travels in a
// hidden input that's left out entirely for "Any", so URLs stay clean.
export function FormSelect({
  id,
  name,
  defaultValue,
  placeholder,
  options,
  icon,
  className,
}: {
  id?: string;
  name: string;
  defaultValue?: string;
  placeholder: string;
  options: FormSelectOption[];
  icon?: React.ReactNode;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue || ANY);

  return (
    <>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger id={id} className={cn("h-9 w-full bg-white text-xs data-[size=default]:h-9", className)}>
          <span className="flex min-w-0 items-center gap-2">
            {icon}
            <SelectValue placeholder={placeholder} />
          </span>
        </SelectTrigger>
        <SelectContent className="light max-h-72">
          <SelectItem value={ANY}>{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value !== ANY && <input type="hidden" name={name} value={value} />}
    </>
  );
}
