"use client";

import * as React from "react";
import { Calendar } from "lucide-react";

import { cn } from "@/lib/utils";

type DateInputProps = Omit<React.ComponentProps<"input">, "type"> & {
  placeholder?: string;
};

function formatDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      className,
      defaultValue,
      value,
      onChange,
      disabled,
      placeholder = "Select date",
      ...props
    },
    ref,
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [internalValue, setInternalValue] = React.useState(
      typeof defaultValue === "string" ? defaultValue : "",
    );
    const [useNativeTapTarget, setUseNativeTapTarget] = React.useState(false);
    const isControlled = typeof value === "string";
    const currentValue = isControlled ? value : internalValue;

    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    React.useEffect(() => {
      if (typeof navigator === "undefined") {
        return;
      }

      const hasTouchPoints = (navigator.maxTouchPoints ?? 0) > 0;
      const hasCoarsePointer =
        typeof window !== "undefined" &&
        window.matchMedia?.("(pointer: coarse)").matches;

      setUseNativeTapTarget(hasTouchPoints || Boolean(hasCoarsePointer));
    }, []);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalValue(event.target.value);
      }

      onChange?.(event);
    };

    const handleOpenPicker = () => {
      if (disabled || useNativeTapTarget) {
        return;
      }

      const input = inputRef.current;

      if (!input) {
        return;
      }

      if (typeof input.showPicker === "function") {
        input.showPicker();
        return;
      }

      input.focus();
      input.click();
    };

    return (
      <div className="relative">
        <input
          ref={inputRef}
          type="date"
          className={cn(
            "absolute inset-0 h-full w-full opacity-0",
            useNativeTapTarget
              ? "z-10 cursor-pointer"
              : "pointer-events-none z-0",
            className,
          )}
          defaultValue={defaultValue}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          {...props}
        />
        <div
          aria-hidden="true"
          onClick={handleOpenPicker}
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-black flex h-9 w-full min-w-0 cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-lg border-2 bg-card px-3 py-1 text-base shadow-hard-sm transition-[color,box-shadow] outline-none md:text-sm",
            "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <span
            className={cn(
              "truncate",
              currentValue ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {currentValue ? formatDateValue(currentValue) : placeholder}
          </span>
          <Calendar className="size-4 shrink-0 text-muted-foreground" />
        </div>
      </div>
    );
  },
);

DateInput.displayName = "DateInput";

export { DateInput };
