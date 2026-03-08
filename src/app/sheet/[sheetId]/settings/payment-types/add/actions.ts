"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { paymentTypes } from "@/lib/db/schema";

export async function addPaymentType(formData: FormData) {
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

  await db.insert(paymentTypes).values({
    sheetId,
    name,
    icon,
    createdBy: user.id,
  });

  redirect(`/sheet/${sheetId}/settings/payment-types`);
}
