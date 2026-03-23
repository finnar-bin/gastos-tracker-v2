"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireSheetPermission } from "@/lib/auth/sheets";
import type { FormActionResult } from "@/lib/form-state";
import { parseAndValidateAmount } from "@/lib/validation/amount";

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

  return { success: "Transaction saved." };
}

export async function updateTransaction(
  formData: FormData,
): Promise<FormActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { redirectTo: "/login" };
  }

  const transactionId = formData.get("transactionId") as string;
  const sheetId = formData.get("sheetId") as string;
  const type = formData.get("type") as "income" | "expense";
  const categoryId = formData.get("categoryId") as string;
  const description = formData.get("description") as string;
  const paymentTypeValue = formData.get("paymentType");
  const paymentType =
    typeof paymentTypeValue === "string" && paymentTypeValue.trim().length > 0
      ? paymentTypeValue
      : null;
  const dateStr = formData.get("date") as string;
  const date = dateStr || new Date().toISOString().split("T")[0];

  const fieldErrors: FormActionResult["fieldErrors"] = {};
  if (!transactionId) fieldErrors.transactionId = "Invalid transaction.";
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

  await requireSheetPermission(sheetId, "canEditTransaction");
  try {
    await db
      .update(transactions)
      .set({
        createdBy: user.id,
        createdAt: new Date(),
        amount: amount.toString(),
        type,
        categoryId,
        description,
        paymentType,
        date,
      })
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.sheetId, sheetId),
        ),
      );
  } catch (error) {
    console.error("Error updating transaction:", error);
    return { error: "Failed to save transaction. Please review the form and try again." };
  }

  return { success: "Transaction updated." };
}

export async function deleteTransaction(
  formData: FormData,
): Promise<FormActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { redirectTo: "/login" };
  }

  const transactionId = formData.get("transactionId") as string;
  const sheetId = formData.get("sheetId") as string;
  const fieldErrors: FormActionResult["fieldErrors"] = {};

  if (!transactionId) fieldErrors.transactionId = "Invalid transaction.";
  if (!sheetId) fieldErrors.sheetId = "Invalid sheet.";

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Unable to delete this transaction.", fieldErrors };
  }

  await requireSheetPermission(sheetId, "canDeleteTransaction");
  try {
    const deleted = await db
      .delete(transactions)
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.sheetId, sheetId),
        ),
      )
      .returning({ id: transactions.id });

    if (!deleted[0]) {
      return { error: "Transaction not found or already deleted." };
    }
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return { error: "Failed to delete transaction. Please try again." };
  }

  return { success: "Transaction deleted." };
}
