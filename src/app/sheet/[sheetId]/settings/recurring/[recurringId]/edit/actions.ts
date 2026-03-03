"use server";

import { db } from "@/lib/db";
import { recurringTransactions } from "@/lib/db/schema";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { eq, and } from "drizzle-orm";

export async function updateRecurringTransaction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const recurringId = formData.get("recurringId") as string;
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

  // Calculate initial nextProcessDate if frequency or dayOfMonth changed
  // For simplicity in this edit, we'll keep the existing nextProcessDate
  // unless we want to recalculate it. Usually, editing shouldn't necessarily
  // reset the schedule unless frequency changes.

  // Let's get the existing one first to see if frequency changed
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
    let nextDate = new Date(now.toISOString().split("T")[0]);

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

  await db
    .update(recurringTransactions)
    .set({
      categoryId,
      paymentType,
      amount,
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

  redirect(`/sheet/${sheetId}/settings/recurring`);
}

export async function deleteRecurringTransaction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const recurringId = formData.get("recurringId") as string;
  const sheetId = formData.get("sheetId") as string;

  await db
    .delete(recurringTransactions)
    .where(
      and(
        eq(recurringTransactions.id, recurringId),
        eq(recurringTransactions.sheetId, sheetId),
      ),
    );

  redirect(`/sheet/${sheetId}/settings/recurring`);
}
