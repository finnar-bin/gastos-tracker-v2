"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TabHeaderItem = {
  value: string;
  label: string;
  icon?: ReactNode;
};

export function TabHeader({
  items,
  value,
  onChangeAction,
  className,
}: {
  items: TabHeaderItem[];
  value: string;
  onChangeAction: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-border", className)}>
      <div className="flex items-end gap-1">
        {items.map((item) => {
          const isActive = item.value === value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChangeAction(item.value)}
              className={cn(
                "flex-1 px-4 h-10 rounded-t-lg border border-transparent text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                isActive
                  ? "-mb-px bg-background text-foreground border-border border-b-0"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
              )}
              aria-pressed={isActive}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
