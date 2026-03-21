"use client";

import { LayoutGrid } from "lucide-react";
import { getLucideIcon } from "@/lib/lucide-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
};

export function CategoryPicker({
  categories,
  placeholder = "Select category",
  name,
  value,
  defaultValue,
  onValueChange,
  required,
  triggerClassName,
  includeAllOption = false,
  allOptionLabel = "All Categories",
  allOptionValue = "all",
}: CategoryPickerProps) {
  return (
    <Select
      name={name}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      required={required}
    >
      <SelectTrigger className={cn("w-full", triggerClassName)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeAllOption ? (
          <SelectItem value={allOptionValue}>{allOptionLabel}</SelectItem>
        ) : null}
        {categories.map((category) => {
          const Icon = category.icon ? (getLucideIcon(category.icon) ?? LayoutGrid) : null;
          return (
            <SelectItem key={category.id} value={category.id}>
              <div className="flex items-center gap-2">
                {Icon ? <Icon className="h-4 w-4" /> : null}
                <span>{category.name}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
