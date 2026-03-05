import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function getLucideIcon(name: string | null | undefined): LucideIcon | null {
  if (!name) return null;

  const icon = LucideIcons[name as keyof typeof LucideIcons];
  return typeof icon === "function" ? (icon as LucideIcon) : null;
}
