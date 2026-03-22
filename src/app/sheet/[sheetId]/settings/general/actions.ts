"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { profiles, sheetSettings, sheets } from "@/lib/db/schema";
import { CURRENCY_CODES } from "@/lib/constants/currencies";
import { revalidatePath } from "next/cache";
import { requireSheetAccess, requireSheetPermission } from "@/lib/auth/sheets";
import { eq } from "drizzle-orm";

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
  const nameRaw = formData.get("name") as string;
  const descriptionRaw = formData.get("description") as string;
  const pushNotificationsEnabledRaw = formData.get("pushNotificationsEnabled");

  if (!sheetId) {
    return { error: "Invalid sheet." };
  }

  const { permissions } = await requireSheetAccess(sheetId);
  if (!permissions.canEditSheetSettings) {
    return { error: "You do not have permission to update sheet settings." };
  }

  const currency = normalizeCurrency(currencyRaw);
  const name = nameRaw?.trim();
  const description = descriptionRaw?.trim() ? descriptionRaw.trim() : null;
  const pushNotificationsEnabled = pushNotificationsEnabledRaw === "on";

  if (!name) {
    return { error: "Sheet name is required." };
  }

  if (!currency || !CURRENCY_CODES.has(currency)) {
    return { error: "Please select a valid currency." };
  }

  await db
    .update(sheets)
    .set({
      name,
      description,
      updatedAt: new Date(),
    })
    .where(eq(sheets.id, sheetId));

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

  await db
    .insert(profiles)
    .values({
      id: user.id,
      email: user.email ?? "",
      displayName:
        (user.user_metadata?.display_name as string | undefined) ?? null,
      avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
      pushNotificationsEnabled,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: {
        pushNotificationsEnabled,
        updatedAt: new Date(),
      },
    });

  revalidatePath(`/sheet/${sheetId}`);
  revalidatePath(`/sheet/${sheetId}/settings/general`);
  return { success: "Settings updated." };
}

export async function deleteSheet(
  formData: FormData,
): Promise<{ error?: string; redirectTo?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { redirectTo: "/login" };
  }

  const sheetId = formData.get("sheetId") as string;
  if (!sheetId) {
    return { error: "Invalid sheet." };
  }

  await requireSheetPermission(sheetId, "canDeleteSheet");

  try {
    const deleteResult = await db
      .delete(sheets)
      .where(eq(sheets.id, sheetId))
      .returning({ id: sheets.id });

    if (!deleteResult[0]) {
      return { error: "Sheet not found or already deleted." };
    }
  } catch (error) {
    console.error("Error deleting sheet:", error);
    return { error: "Failed to delete sheet. Please try again." };
  }

  revalidatePath("/sheet");
  return { redirectTo: "/sheet" };
}
