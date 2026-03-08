"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sheetSettings } from "@/lib/db/schema";
import { CURRENCY_CODES } from "@/lib/constants/currencies";
import { revalidatePath } from "next/cache";
import { requireSheetAccess } from "@/lib/auth/sheets";

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
