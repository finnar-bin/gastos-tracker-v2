"use server";

import { and, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { paymentTypes } from "@/lib/db/schema";
import { requireSheetPermission } from "@/lib/auth/sheets";
import type { FormActionResult } from "@/lib/form-state";

export async function updatePaymentType(
  formData: FormData,
): Promise<FormActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { redirectTo: "/login" };
  }

  const paymentTypeId = formData.get("paymentTypeId") as string;
  const sheetId = formData.get("sheetId") as string;
  const name = (formData.get("name") as string)?.trim();
  const icon = (formData.get("icon") as string)?.trim();

  const fieldErrors: FormActionResult["fieldErrors"] = {};
  if (!paymentTypeId) fieldErrors.paymentTypeId = "Invalid payment type.";
  if (!sheetId) fieldErrors.sheetId = "Invalid sheet.";
  if (!name) fieldErrors.name = "Name is required.";
  if (!icon) fieldErrors.icon = "Icon is required.";

  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  await requireSheetPermission(sheetId, "canEditPaymentType");
  try {
    await db
      .update(paymentTypes)
      .set({ name, icon })
      .where(
        and(
          eq(paymentTypes.id, paymentTypeId),
          eq(paymentTypes.sheetId, sheetId),
        ),
      );
  } catch (error) {
    console.error("Error updating payment type:", error);
    return { error: "Failed to save payment type. Please review the form and try again." };
  }

  return { redirectTo: `/sheet/${sheetId}/settings/payment-types` };
}

export async function deletePaymentType(
  formData: FormData,
): Promise<FormActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { redirectTo: "/login" };
  }

  const paymentTypeId = formData.get("paymentTypeId") as string;
  const sheetId = formData.get("sheetId") as string;
  const fieldErrors: FormActionResult["fieldErrors"] = {};

  if (!paymentTypeId) fieldErrors.paymentTypeId = "Invalid payment type.";
  if (!sheetId) fieldErrors.sheetId = "Invalid sheet.";

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Unable to delete this payment type.", fieldErrors };
  }

  await requireSheetPermission(sheetId, "canDeletePaymentType");
  try {
    const deleted = await db
      .delete(paymentTypes)
      .where(
        and(
          eq(paymentTypes.id, paymentTypeId),
          eq(paymentTypes.sheetId, sheetId),
        ),
      )
      .returning({ id: paymentTypes.id });

    if (!deleted[0]) {
      return { error: "Payment type not found or already deleted." };
    }
  } catch (error) {
    console.error("Error deleting payment type:", error);
    return { error: "Failed to delete payment type. Please try again." };
  }

  return { redirectTo: `/sheet/${sheetId}/settings/payment-types` };
}
