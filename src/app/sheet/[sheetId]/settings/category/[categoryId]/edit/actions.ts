"use server";

import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { eq, and } from "drizzle-orm";
import { requireSheetPermission } from "@/lib/auth/sheets";

export async function updateCategory(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const categoryId = formData.get("categoryId") as string;
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

  await requireSheetPermission(sheetId, "canEditCategory");

  await db
    .update(categories)
    .set({
      name,
      icon,
      type,
      budget,
      defaultAmount,
      dueDate,
    })
    .where(and(eq(categories.id, categoryId), eq(categories.sheetId, sheetId)));

  redirect(`/sheet/${sheetId}/settings/category`);
}

export async function deleteCategory(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const categoryId = formData.get("categoryId") as string;
  const sheetId = formData.get("sheetId") as string;

  await requireSheetPermission(sheetId, "canDeleteCategory");

  await db
    .delete(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.sheetId, sheetId)));

  redirect(`/sheet/${sheetId}/settings/category`);
}
