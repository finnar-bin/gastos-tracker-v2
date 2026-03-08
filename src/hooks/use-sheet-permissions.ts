"use client";

import { useMemo } from "react";
import {
  getSheetPermissions,
  type SheetRole,
} from "@/lib/auth/sheet-permissions";

export function useSheetPermissions(role: SheetRole | null | undefined) {
  return useMemo(() => getSheetPermissions(role), [role]);
}
