"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { paymentTypes } from "@/lib/db/schema";
import { requireSheetPermission } from "@/lib/auth/sheets";
import type { FormActionResult } from "@/lib/form-state";

export async function addPaymentType(
  formData: FormData,
): Promise<FormActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { redirectTo: "/login" };
  }

  const sheetId = formData.get("sheetId") as string;
  const name = (formData.get("name") as string)?.trim();
  const icon = (formData.get("icon") as string)?.trim();
  const inPlace = formData.get("inPlace") === "1";

  const fieldErrors: FormActionResult["fieldErrors"] = {};
  if (!sheetId) fieldErrors.sheetId = "Invalid sheet.";
  if (!name) fieldErrors.name = "Name is required.";
  if (!icon) fieldErrors.icon = "Icon is required.";

  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  await requireSheetPermission(sheetId, "canAddPaymentType");
  try {
    await db.insert(paymentTypes).values({
      sheetId,
      name,
      icon,
      createdBy: user.id,
    });
  } catch (error) {
    console.error("Error adding payment type:", error);
    return { error: "Failed to save payment type. Please review the form and try again." };
  }

  if (inPlace) {
    return { success: "Payment type created." };
  }

  return { redirectTo: `/sheet/${sheetId}/settings/payment-types` };
}
