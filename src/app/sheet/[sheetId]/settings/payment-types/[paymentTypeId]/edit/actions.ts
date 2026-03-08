"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { paymentTypes } from "@/lib/db/schema";
import { requireSheetPermission } from "@/lib/auth/sheets";

export async function updatePaymentType(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const paymentTypeId = formData.get("paymentTypeId") as string;
  const sheetId = formData.get("sheetId") as string;
  const name = formData.get("name") as string;
  const icon = formData.get("icon") as string;

  await requireSheetPermission(sheetId, "canEditPaymentType");

  await db
    .update(paymentTypes)
    .set({ name, icon })
    .where(
      and(
        eq(paymentTypes.id, paymentTypeId),
        eq(paymentTypes.sheetId, sheetId),
      ),
    );

  redirect(`/sheet/${sheetId}/settings/payment-types`);
}

export async function deletePaymentType(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const paymentTypeId = formData.get("paymentTypeId") as string;
  const sheetId = formData.get("sheetId") as string;

  await requireSheetPermission(sheetId, "canDeletePaymentType");

  await db
    .delete(paymentTypes)
    .where(
      and(
        eq(paymentTypes.id, paymentTypeId),
        eq(paymentTypes.sheetId, sheetId),
      ),
    );

  redirect(`/sheet/${sheetId}/settings/payment-types`);
}
