"use server";

import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { eq, and } from "drizzle-orm";
import { requireSheetPermission } from "@/lib/auth/sheets";
import type { FormActionResult } from "@/lib/form-state";
import { parseOptionalAmount } from "@/lib/validation/amount";

export async function updateCategory(
  formData: FormData,
): Promise<FormActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { redirectTo: "/login" };
  }

  const categoryId = formData.get("categoryId") as string;
  const sheetId = formData.get("sheetId") as string;
  const name = (formData.get("name") as string)?.trim();
  const icon = (formData.get("icon") as string)?.trim();
  const type = formData.get("type") as "income" | "expense";
  const budgetValue = formData.get("budget");
  const defaultAmountValue = formData.get("defaultAmount");
  const returnType = formData.get("returnType") as string | null;
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

  if (!categoryId) fieldErrors.categoryId = "Invalid category.";
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

  await requireSheetPermission(sheetId, "canEditCategory");
  try {
    await db
      .update(categories)
      .set({
        name,
        icon,
        type,
        budget,
        defaultAmount,
        dueDate,
        dueReminderFrequency: resolvedDueReminderFrequency,
        dueLastNotifiedOn: null,
      })
      .where(and(eq(categories.id, categoryId), eq(categories.sheetId, sheetId)));
  } catch (error) {
    console.error("Error updating category:", error);
    return { error: "Failed to save category. Please review the form and try again." };
  }

  return {
    redirectTo: `/sheet/${sheetId}/settings/category?type=${
      returnType === "income" ? "income" : type
    }`,
  };
}

export async function deleteCategory(
  formData: FormData,
): Promise<FormActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { redirectTo: "/login" };
  }

  const categoryId = formData.get("categoryId") as string;
  const sheetId = formData.get("sheetId") as string;
  const returnType = formData.get("returnType") as string | null;
  const fieldErrors: FormActionResult["fieldErrors"] = {};

  if (!categoryId) fieldErrors.categoryId = "Invalid category.";
  if (!sheetId) fieldErrors.sheetId = "Invalid sheet.";

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Unable to delete this category.", fieldErrors };
  }

  await requireSheetPermission(sheetId, "canDeleteCategory");
  try {
    const deleted = await db
      .delete(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.sheetId, sheetId)))
      .returning({ id: categories.id });

    if (!deleted[0]) {
      return { error: "Category not found or already deleted." };
    }
  } catch (error) {
    console.error("Error deleting category:", error);
    return { error: "Failed to delete category. Please try again." };
  }

  return {
    redirectTo: `/sheet/${sheetId}/settings/category?type=${
      returnType === "income" ? "income" : "expense"
    }`,
  };
}
