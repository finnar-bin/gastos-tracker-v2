import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SheetContentShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("container max-w-md mx-auto p-4 space-y-6", className)}>
      {children}
    </div>
  );
}
