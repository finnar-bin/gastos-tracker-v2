"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";

export async function addTransaction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const amount = parseFloat(formData.get("amount") as string);
  const type = formData.get("type") as "income" | "expense";
  const categoryId = formData.get("categoryId") as string;
  const sheetId = formData.get("sheetId") as string;
  const description = formData.get("description") as string;
  const paymentType = formData.get("paymentType") as string;
  const dateStr = formData.get("date") as string;
  const date = dateStr || new Date().toISOString().split("T")[0];

  if (!paymentType) {
    throw new Error("Payment type is required");
  }

  await db.insert(transactions).values({
    createdBy: user.id,
    sheetId,
    categoryId,
    paymentType,
    amount: amount.toString(), // Store as string for decimal
    type,
    description,
    date,
  });

  redirect(`/sheet/${sheetId}`);
}
