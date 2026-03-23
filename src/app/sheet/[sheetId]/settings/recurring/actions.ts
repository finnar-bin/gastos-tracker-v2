"use server";

import { db } from "@/lib/db";
import { recurringTransactions } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { eq, and } from "drizzle-orm";
import { requireSheetPermission } from "@/lib/auth/sheets";
import { parseAndValidateAmount } from "@/lib/validation/amount";
import type { FormActionResult } from "@/lib/form-state";

export async function addRecurringTransaction(
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
  const categoryId = formData.get("categoryId") as string;
  const type = formData.get("type") as "income" | "expense";
  const paymentTypeValue = formData.get("paymentType");
  const paymentType =
    type === "income"
      ? null
      : typeof paymentTypeValue === "string" && paymentTypeValue.length > 0
        ? paymentTypeValue
        : null;
  const description = formData.get("description") as string;
  const frequency = formData.get("frequency") as
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly";
  const dayOfMonthValue = (formData.get("dayOfMonth") as string | null)?.trim();

  const fieldErrors: FormActionResult["fieldErrors"] = {};

  if (!sheetId) fieldErrors.sheetId = "Invalid sheet.";
  if (!categoryId) fieldErrors.categoryId = "Category is required.";
  if (type !== "income" && type !== "expense") {
    fieldErrors.type = "Recurring transaction type is required.";
  }
  if (
    frequency !== "daily" &&
    frequency !== "weekly" &&
    frequency !== "monthly" &&
    frequency !== "yearly"
  ) {
    fieldErrors.frequency = "Frequency is required.";
  }
  if (type === "expense" && !paymentType) {
    fieldErrors.paymentType = "Payment type is required for expense transactions.";
  }

  let amount: string | null = null;
  try {
    amount = parseAndValidateAmount(formData.get("amount")).toString();
  } catch (error) {
    fieldErrors.amount =
      error instanceof Error ? error.message : "Amount is invalid.";
  }

  let dayOfMonth: number | null = null;
  if (frequency === "monthly") {
    if (!dayOfMonthValue) {
      fieldErrors.dayOfMonth = "Day of month is required for monthly schedules.";
    } else {
      dayOfMonth = Number.parseInt(dayOfMonthValue, 10);
      if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
        fieldErrors.dayOfMonth = "Day of month must be between 1 and 31.";
      }
    }
  }

  if (frequency !== "monthly") {
    dayOfMonth = null;
  }

  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  await requireSheetPermission(sheetId, "canAddRecurringTransaction");

  // Calculate initial nextProcessDate
  const now = new Date();
  const nextDate = new Date(now.toISOString().split("T")[0]);

  if (frequency === "monthly" && dayOfMonth) {
    nextDate.setDate(dayOfMonth);
    // If the date has already passed this month, move to next month
    if (nextDate < now) {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
  } else if (frequency === "daily") {
    nextDate.setDate(nextDate.getDate() + 1);
  } else if (frequency === "weekly") {
    nextDate.setDate(nextDate.getDate() + 7);
  } else if (frequency === "yearly") {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  }

  try {
    await db.insert(recurringTransactions).values({
      sheetId,
      categoryId,
      paymentType,
      amount: amount!,
      type,
      description,
      frequency,
      dayOfMonth: dayOfMonth?.toString(),
      nextProcessDate: nextDate.toISOString().split("T")[0],
      createdBy: user.id,
    });
  } catch (error) {
    console.error("Error adding recurring transaction:", error);
    return {
      error:
        "Failed to save recurring transaction. Please review the form and try again.",
    };
  }

  return { success: "Recurring schedule created." };
}

export async function updateRecurringTransaction(
  formData: FormData,
): Promise<FormActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { redirectTo: "/login" };
  }

  const recurringId = formData.get("recurringId") as string;
  const sheetId = formData.get("sheetId") as string;
  const categoryId = formData.get("categoryId") as string;
  const type = formData.get("type") as "income" | "expense";
  const paymentTypeValue = formData.get("paymentType");
  const paymentType =
    type === "income"
      ? null
      : typeof paymentTypeValue === "string" && paymentTypeValue.length > 0
        ? paymentTypeValue
        : null;
  const description = formData.get("description") as string;
  const frequency = formData.get("frequency") as
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly";
  const dayOfMonthValue = (formData.get("dayOfMonth") as string | null)?.trim();

  const fieldErrors: FormActionResult["fieldErrors"] = {};
  if (!recurringId) fieldErrors.recurringId = "Invalid recurring schedule.";
  if (!sheetId) fieldErrors.sheetId = "Invalid sheet.";
  if (!categoryId) fieldErrors.categoryId = "Category is required.";
  if (type !== "income" && type !== "expense") {
    fieldErrors.type = "Recurring transaction type is required.";
  }
  if (
    frequency !== "daily" &&
    frequency !== "weekly" &&
    frequency !== "monthly" &&
    frequency !== "yearly"
  ) {
    fieldErrors.frequency = "Frequency is required.";
  }
  if (type === "expense" && !paymentType) {
    fieldErrors.paymentType = "Payment type is required for expense transactions.";
  }

  let amount: string | null = null;
  try {
    amount = parseAndValidateAmount(formData.get("amount")).toString();
  } catch (error) {
    fieldErrors.amount =
      error instanceof Error ? error.message : "Amount is invalid.";
  }

  let dayOfMonth: number | null = null;
  if (frequency === "monthly") {
    if (!dayOfMonthValue) {
      fieldErrors.dayOfMonth = "Day of month is required for monthly schedules.";
    } else {
      dayOfMonth = Number.parseInt(dayOfMonthValue, 10);
      if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
        fieldErrors.dayOfMonth = "Day of month must be between 1 and 31.";
      }
    }
  }

  if (frequency !== "monthly") {
    dayOfMonth = null;
  }

  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  await requireSheetPermission(sheetId, "canEditRecurringTransaction");

  const [existing] = await db
    .select()
    .from(recurringTransactions)
    .where(eq(recurringTransactions.id, recurringId));

  let nextProcessDate = existing.nextProcessDate;

  if (
    existing.frequency !== frequency ||
    (frequency === "monthly" && existing.dayOfMonth !== dayOfMonth?.toString())
  ) {
    const now = new Date();
    const nextDate = new Date(now.toISOString().split("T")[0]);

    if (frequency === "monthly" && dayOfMonth) {
      nextDate.setDate(dayOfMonth);
      if (nextDate < now) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
    } else if (frequency === "daily") {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (frequency === "weekly") {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (frequency === "yearly") {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
    nextProcessDate = nextDate.toISOString().split("T")[0];
  }

  try {
    await db
      .update(recurringTransactions)
      .set({
        categoryId,
        paymentType,
        amount: amount!,
        type,
        description,
        frequency,
        dayOfMonth: dayOfMonth?.toString(),
        nextProcessDate,
      })
      .where(
        and(
          eq(recurringTransactions.id, recurringId),
          eq(recurringTransactions.sheetId, sheetId),
        ),
      );
  } catch (error) {
    console.error("Error updating recurring transaction:", error);
    return {
      error:
        "Failed to save recurring transaction. Please review the form and try again.",
    };
  }

  return { success: "Recurring schedule updated." };
}

export async function deleteRecurringTransaction(
  formData: FormData,
): Promise<FormActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { redirectTo: "/login" };
  }

  const recurringId = formData.get("recurringId") as string;
  const sheetId = formData.get("sheetId") as string;
  const fieldErrors: FormActionResult["fieldErrors"] = {};

  if (!recurringId) fieldErrors.recurringId = "Invalid recurring schedule.";
  if (!sheetId) fieldErrors.sheetId = "Invalid sheet.";

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Unable to delete this recurring schedule.", fieldErrors };
  }

  await requireSheetPermission(sheetId, "canDeleteRecurringTransaction");
  try {
    const deleted = await db
      .delete(recurringTransactions)
      .where(
        and(
          eq(recurringTransactions.id, recurringId),
          eq(recurringTransactions.sheetId, sheetId),
        ),
      )
      .returning({ id: recurringTransactions.id });

    if (!deleted[0]) {
      return { error: "Recurring schedule not found or already deleted." };
    }
  } catch (error) {
    console.error("Error deleting recurring transaction:", error);
    return { error: "Failed to delete recurring schedule. Please try again." };
  }

  return { success: "Recurring schedule deleted." };
}
