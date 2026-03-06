"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function updateTransaction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const transactionId = formData.get("transactionId") as string;
  const sheetId = formData.get("sheetId") as string;
  const amount = parseFloat(formData.get("amount") as string);
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

  if (type === "expense" && !paymentType) {
    throw new Error("Payment type is required for expense transactions");
  }

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
        eq(transactions.createdBy, user.id),
      ),
    );

  redirect(`/sheet/${sheetId}/history`);
}

export async function deleteTransaction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const transactionId = formData.get("transactionId") as string;
  const sheetId = formData.get("sheetId") as string;

  await db
    .delete(transactions)
    .where(
      and(
        eq(transactions.id, transactionId),
        eq(transactions.sheetId, sheetId),
        eq(transactions.createdBy, user.id),
      ),
    );

  redirect(`/sheet/${sheetId}/history`);
}
