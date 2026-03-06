import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function getLucideIcon(
  name: string | null | undefined,
): LucideIcon | null {
  if (!name) return null;

  const icon = LucideIcons[name as keyof typeof LucideIcons];
  if (!icon) return null;

  // lucide-react icons are ForwardRef components in React 19, which are objects
  // (with $$typeof) rather than plain functions.
  if (
    typeof icon === "function" ||
    (typeof icon === "object" && "$$typeof" in icon)
  ) {
    return icon as LucideIcon;
  }

  return null;
}
