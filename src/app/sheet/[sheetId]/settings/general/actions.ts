"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sheetSettings, sheets } from "@/lib/db/schema";
import { CURRENCY_CODES } from "@/lib/constants/currencies";
import { revalidatePath } from "next/cache";
import { requireSheetAccess } from "@/lib/auth/sheets";
import { getSheetRoleForUser } from "@/lib/invite-service";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

function normalizeCurrency(rawValue: string) {
  const trimmed = rawValue.trim().toUpperCase();
  const code = trimmed.match(/^[A-Z]{3}/)?.[0] ?? "";
  return code;
}

export async function upsertSheetCurrency(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to login first." };
  }

  const sheetId = formData.get("sheetId") as string;
  const currencyRaw = formData.get("currency") as string;

  if (!sheetId) {
    return { error: "Invalid sheet." };
  }

  await requireSheetAccess(sheetId);

  const currency = normalizeCurrency(currencyRaw);

  if (!currency || !CURRENCY_CODES.has(currency)) {
    return { error: "Please select a valid currency." };
  }

  await db
    .insert(sheetSettings)
    .values({
      sheetId,
      currency,
      updatedBy: user.id,
    })
    .onConflictDoUpdate({
      target: sheetSettings.sheetId,
      set: {
        currency,
        updatedBy: user.id,
        updatedAt: new Date(),
      },
    });

  revalidatePath(`/sheet/${sheetId}`);
  revalidatePath(`/sheet/${sheetId}/settings/general`);
  return { success: "Currency updated." };
}

export async function deleteSheet(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const sheetId = formData.get("sheetId") as string;
  if (!sheetId) {
    return;
  }

  await requireSheetAccess(sheetId);

  const role = await getSheetRoleForUser(sheetId, user.id);
  if (role !== "admin") {
    return;
  }

  const deleteResult = await db
    .delete(sheets)
    .where(eq(sheets.id, sheetId))
    .returning({ id: sheets.id });

  if (!deleteResult[0]) {
    return;
  }

  revalidatePath("/sheet");
  redirect("/sheet");
}
