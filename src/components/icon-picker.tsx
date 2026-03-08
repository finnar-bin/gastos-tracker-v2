"use client";

import { useState } from "react";
import { SmilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getLucideIcon } from "@/lib/lucide-icons";

function renderLucideIcon(name: string, className: string) {
  const Icon = getLucideIcon(name);
  return Icon ? <Icon className={className} /> : null;
}

export function IconPicker({
  value,
  onChangeAction,
  icons,
  maxRows = 5,
}: {
  value: string;
  onChangeAction: (value: string) => void;
  icons: readonly string[];
  maxRows?: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          className={`w-full justify-start gap-2 h-9 border-2 border-black rounded-lg bg-card shadow-hard-sm px-3 py-1 text-base md:text-sm font-normal hover:bg-card hover:translate-x-0 hover:translate-y-0 hover:shadow-hard-sm ${value ? "text-foreground" : "text-muted-foreground"}`}
        >
          {value ? (
            <>
              {renderLucideIcon(value, "h-4 w-4")}
              <span>{value}</span>
            </>
          ) : (
            <>
              <SmilePlus className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Select an icon</span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-70 p-2" align="start">
        <div
          className="grid grid-cols-6 gap-1 overflow-y-auto p-0.5"
          style={{ maxHeight: `calc(${maxRows} * 40px)` }}
        >
          {icons.map((iconName) => (
            <button
              key={iconName}
              type="button"
              onClick={() => {
                onChangeAction(iconName);
                setOpen(false);
              }}
              className={`p-2 flex items-center justify-center rounded-md hover:bg-accent transition-colors ${
                value === iconName ? "bg-primary/20 ring-2 ring-primary" : ""
              }`}
              title={iconName}
            >
              {renderLucideIcon(iconName, "h-5 w-5")}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
