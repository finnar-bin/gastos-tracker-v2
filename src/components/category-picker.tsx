"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { SearchableSelect } from "@/components/searchable-select";
import { getLucideIcon } from "@/lib/lucide-icons";

export type CategoryPickerOption = {
  id: string;
  name: string;
  icon?: string | null;
};

type CategoryPickerProps = {
  categories: CategoryPickerOption[];
  placeholder?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  triggerClassName?: string;
  includeAllOption?: boolean;
  allOptionLabel?: string;
  allOptionValue?: string;
  disabled?: boolean;
};

export function CategoryPicker({
  categories,
  placeholder = "Select category",
  name,
  value,
  defaultValue,
  onValueChange,
  triggerClassName,
  includeAllOption = false,
  allOptionLabel = "All Categories",
  allOptionValue = "all",
  disabled = false,
}: CategoryPickerProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");

  useEffect(() => {
    if (!isControlled) {
      setInternalValue(defaultValue ?? "");
    }
  }, [defaultValue, isControlled]);

  const resolvedValue = isControlled ? value : internalValue;

  const options = useMemo(() => {
    const categoryOptions = categories.map((category) => ({
      value: category.id,
      label: category.name,
      icon: category.icon,
      searchText: category.name,
    }));

    return includeAllOption
      ? [
          {
            value: allOptionValue,
            label: allOptionLabel,
            searchText: allOptionLabel,
          },
          ...categoryOptions,
        ]
      : categoryOptions;
  }, [allOptionLabel, allOptionValue, categories, includeAllOption]);

  const handleValueChange = (nextValue: string) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
  };

  return (
    <SearchableSelect
      name={name}
      value={resolvedValue}
      onValueChange={handleValueChange}
      options={options}
      placeholder={placeholder}
      searchPlaceholder="Search category..."
      emptyMessage="No categories found."
      className={triggerClassName}
      disabled={disabled}
      renderOption={(option) => {
        const Icon = "icon" in option && option.icon
          ? (getLucideIcon(option.icon) ?? LayoutGrid)
          : null;

        return (
          <span className="flex items-center gap-2">
            {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
            <span className="truncate">{option.label}</span>
          </span>
        );
      }}
      renderValue={(option) => {
        const Icon = "icon" in option && option.icon
          ? (getLucideIcon(option.icon) ?? LayoutGrid)
          : null;

        return (
          <span className="flex items-center gap-2">
            {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
            <span className="truncate">{option.label}</span>
          </span>
        );
      }}
    />
  );
}
