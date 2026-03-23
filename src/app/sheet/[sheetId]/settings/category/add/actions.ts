"use server";

import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { requireSheetPermission } from "@/lib/auth/sheets";
import type { FormActionResult } from "@/lib/form-state";
import { parseOptionalAmount } from "@/lib/validation/amount";

export async function addCategory(
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
  const type = formData.get("type") as "income" | "expense";
  const budgetValue = formData.get("budget");
  const defaultAmountValue = formData.get("defaultAmount");
  const dueDate = formData.get("dueDate")
    ? (formData.get("dueDate") as string)
    : null;
  const dueReminderFrequencyValue = formData.get("dueReminderFrequency");
  const dueReminderFrequency =
    typeof dueReminderFrequencyValue === "string" &&
    dueReminderFrequencyValue !== "none"
      ? (dueReminderFrequencyValue as
          | "specific_date"
          | "daily"
          | "weekly"
          | "monthly")
      : null;
  const resolvedDueReminderFrequency =
    dueDate === null ? null : dueReminderFrequency;
  const fieldErrors: FormActionResult["fieldErrors"] = {};

  if (!sheetId) fieldErrors.sheetId = "Invalid sheet.";
  if (!name) fieldErrors.name = "Name is required.";
  if (!icon) fieldErrors.icon = "Icon is required.";
  if (type !== "income" && type !== "expense") {
    fieldErrors.type = "Category type is required.";
  }

  let budget: string | null = null;
  let defaultAmount: string | null = null;

  try {
    const parsedBudget = parseOptionalAmount(budgetValue, "Budget");
    budget = parsedBudget === null ? null : parsedBudget.toString();
  } catch (error) {
    fieldErrors.budget =
      error instanceof Error ? error.message : "Budget is invalid.";
  }

  try {
    const parsedDefaultAmount = parseOptionalAmount(
      defaultAmountValue,
      "Default amount",
    );
    defaultAmount =
      parsedDefaultAmount === null ? null : parsedDefaultAmount.toString();
  } catch (error) {
    fieldErrors.defaultAmount =
      error instanceof Error ? error.message : "Default amount is invalid.";
  }

  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  await requireSheetPermission(sheetId, "canAddCategory");
  try {
    await db.insert(categories).values({
      sheetId,
      name,
      icon,
      type,
      budget,
      defaultAmount,
      dueDate,
      dueReminderFrequency: resolvedDueReminderFrequency,
      dueLastNotifiedOn: null,
      createdBy: user.id,
    });
  } catch (error) {
    console.error("Error adding category:", error);
    return { error: "Failed to save category. Please review the form and try again." };
  }

  return { success: "Category created." };
}
