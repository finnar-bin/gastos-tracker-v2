"use server";

import { db } from "@/lib/db";
import { recurringTransactions } from "@/lib/db/schema";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addRecurringTransaction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const sheetId = formData.get("sheetId") as string;
  const categoryId = formData.get("categoryId") as string;
  const paymentType = formData.get("paymentType") as string;
  const amount = formData.get("amount") as string;
  const type = formData.get("type") as "income" | "expense";
  const description = formData.get("description") as string;
  const frequency = formData.get("frequency") as
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly";
  let dayOfMonth = formData.get("dayOfMonth")
    ? parseInt(formData.get("dayOfMonth") as string)
    : null;

  if (frequency !== "monthly") {
    dayOfMonth = null;
  }

  // Calculate initial nextProcessDate
  const now = new Date();
  let nextDate = new Date(now.toISOString().split("T")[0]);

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

  await db.insert(recurringTransactions).values({
    sheetId,
    categoryId,
    paymentType,
    amount,
    type,
    description,
    frequency,
    dayOfMonth: dayOfMonth?.toString(),
    nextProcessDate: nextDate.toISOString().split("T")[0],
    createdBy: user.id,
  });

  redirect(`/sheet/${sheetId}/settings/recurring`);
}
