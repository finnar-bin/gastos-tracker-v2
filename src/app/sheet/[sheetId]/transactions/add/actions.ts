"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { requireSheetPermission } from "@/lib/auth/sheets";
import type { FormActionResult } from "@/lib/form-state";
import { parseAndValidateAmount } from "@/lib/validation/amount";

function getSafeReturnTo(sheetId: string, returnTo?: string | null) {
  if (!returnTo) {
    return `/sheet/${sheetId}`;
  }

  const normalized = returnTo.startsWith("/") ? returnTo : `/${returnTo}`;
  if (normalized.startsWith(`/sheet/${sheetId}`)) {
    return normalized;
  }

  return `/sheet/${sheetId}`;
}

export async function addTransaction(formData: FormData): Promise<FormActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { redirectTo: "/login" };
  }

  const type = formData.get("type") as "income" | "expense";
  const categoryId = formData.get("categoryId") as string;
  const sheetId = formData.get("sheetId") as string;
  const description = formData.get("description") as string;
  const paymentTypeValue = formData.get("paymentType");
  const paymentType =
    typeof paymentTypeValue === "string" && paymentTypeValue.trim().length > 0
      ? paymentTypeValue
      : null;
  const dateStr = formData.get("date") as string;
  const date = dateStr || new Date().toISOString().split("T")[0];
  const returnTo = formData.get("returnTo") as string | null;
  const inPlace = formData.get("inPlace") === "1";

  const fieldErrors: FormActionResult["fieldErrors"] = {};

  if (!sheetId) fieldErrors.sheetId = "Invalid sheet.";
  if (!categoryId) fieldErrors.categoryId = "Category is required.";
  if (type !== "income" && type !== "expense") {
    fieldErrors.type = "Transaction type is required.";
  }
  if (!date) fieldErrors.date = "Transaction date is required.";
  if (type === "expense" && !paymentType) {
    fieldErrors.paymentType = "Payment type is required for expense transactions.";
  }

  let amount: number;
  try {
    amount = parseAndValidateAmount(formData.get("amount"));
  } catch (error) {
    fieldErrors.amount =
      error instanceof Error ? error.message : "Amount is invalid.";
    amount = 0;
  }

  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  await requireSheetPermission(sheetId, "canAddTransaction");
  try {
    await db.insert(transactions).values({
      createdBy: user.id,
      sheetId,
      categoryId,
      paymentType,
      amount: amount.toString(),
      type,
      description,
      date,
    });
  } catch (error) {
    console.error("Error adding transaction:", error);
    return { error: "Failed to save transaction. Please review the form and try again." };
  }

  if (inPlace) {
    return { success: "Transaction saved." };
  }

  return { redirectTo: getSafeReturnTo(sheetId, returnTo) };
}
