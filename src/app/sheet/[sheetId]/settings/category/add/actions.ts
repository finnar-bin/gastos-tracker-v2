"use server";

import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addCategory(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const sheetId = formData.get("sheetId") as string;
  const name = formData.get("name") as string;
  const icon = formData.get("icon") as string;
  const type = formData.get("type") as "income" | "expense";
  const budget = formData.get("budget")
    ? (formData.get("budget") as string)
    : null;
  const defaultAmount = formData.get("defaultAmount")
    ? (formData.get("defaultAmount") as string)
    : null;
  const dueDate = formData.get("dueDate")
    ? (formData.get("dueDate") as string)
    : null;

  await db.insert(categories).values({
    sheetId,
    name,
    icon,
    type,
    budget,
    defaultAmount,
    dueDate,
    createdBy: user.id,
  });

  redirect(`/sheet/${sheetId}/settings/category`);
}
