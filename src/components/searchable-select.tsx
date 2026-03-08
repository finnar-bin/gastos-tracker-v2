"use client";

import { useId, useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type SearchableSelectOption = {
  value: string;
  label: string;
};

export function SearchableSelect({
  name,
  value,
  options,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  disabled = false,
  className,
  onValueChange,
}: {
  name?: string;
  value: string;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  onValueChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const listboxId = useId();

  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    const normalizedQuery = query.trim().toLowerCase();
    return options.filter((option) => {
      return (
        option.label.toLowerCase().includes(normalizedQuery) ||
        option.value.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [options, query]);

  return (
    <>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-controls={listboxId}
            aria-expanded={open}
            aria-haspopup="listbox"
            disabled={disabled}
            className={cn(
              "border-black data-placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex h-9 w-full items-center justify-between gap-2 rounded-lg border-2 bg-card px-3 py-2 text-sm whitespace-nowrap shadow-hard-sm transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
              className,
            )}
          >
            <span className="truncate">
              {selectedOption ? selectedOption.label : value || placeholder}
            </span>
            <ChevronDown className="size-4 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-2"
          align="start"
        >
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            autoComplete="off"
          />
          <div
            id={listboxId}
            role="listbox"
            className="mt-2 max-h-64 overflow-y-auto"
          >
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-2 text-xs text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {filteredOptions.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onValueChange(option.value);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground",
                        isSelected && "bg-accent text-accent-foreground",
                      )}
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected ? (
                        <Check className="size-4 shrink-0" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}

export type { SearchableSelectOption };
