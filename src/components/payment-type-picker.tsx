"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard } from "lucide-react";
import { SearchableSelect } from "@/components/searchable-select";
import { getLucideIcon } from "@/lib/lucide-icons";

export type PaymentTypePickerOption = {
  id: string;
  name: string;
  icon?: string | null;
};

type PaymentTypePickerProps = {
  paymentTypes: PaymentTypePickerOption[];
  placeholder?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  triggerClassName?: string;
};

export function PaymentTypePicker({
  paymentTypes,
  placeholder = "Select payment type",
  name,
  value,
  defaultValue,
  onValueChange,
  required,
  disabled = false,
  triggerClassName,
}: PaymentTypePickerProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");

  useEffect(() => {
    if (!isControlled) {
      setInternalValue(defaultValue ?? "");
    }
  }, [defaultValue, isControlled]);

  const resolvedValue = isControlled ? value : internalValue;

  const options = useMemo(
    () =>
      paymentTypes.map((paymentType) => ({
        value: paymentType.id,
        label: paymentType.name,
        icon: paymentType.icon,
        searchText: paymentType.name,
      })),
    [paymentTypes],
  );

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
      searchPlaceholder="Search payment type..."
      emptyMessage="No payment types found."
      className={triggerClassName}
      disabled={disabled}
      required={required}
      renderOption={(option) => {
        const Icon =
          "icon" in option && option.icon
            ? (getLucideIcon(option.icon) ?? CreditCard)
            : null;

        return (
          <span className="flex items-center gap-2">
            {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
            <span className="truncate">{option.label}</span>
          </span>
        );
      }}
      renderValue={(option) => {
        const Icon =
          "icon" in option && option.icon
            ? (getLucideIcon(option.icon) ?? CreditCard)
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
