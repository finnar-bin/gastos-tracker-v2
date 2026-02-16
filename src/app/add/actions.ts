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
  const type = formData.get("type") as string;
  const categoryId = formData.get("categoryId") as string;
  const sheetId = formData.get("sheetId") as string;
  const description = formData.get("description") as string;
  const dateStr = formData.get("date") as string;
  const date = dateStr ? new Date(dateStr) : new Date();

  await db.insert(transactions).values({
    userId: user.id,
    sheetId,
    categoryId,
    amount: amount.toString(), // Store as string for decimal
    type,
    description,
    date,
  });

  redirect("/");
}
