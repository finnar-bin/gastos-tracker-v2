"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sheets, sheetUsers, paymentTypes } from "@/lib/db/schema";

export async function createSheet(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name) {
    return { error: "Name is required" };
  }

  try {
    const [newSheet] = await db
      .insert(sheets)
      .values({
        name,
        description,
        createdBy: user.id,
      })
      .returning();

    await db.insert(sheetUsers).values({
      sheetId: newSheet.id,
      userId: user.id,
      role: "admin",
    });

    await db.insert(paymentTypes).values([
      {
        name: "Cash",
        icon: "Coins",
        sheetId: newSheet.id,
        createdBy: user.id,
      },
      {
        name: "Credit Card",
        icon: "CreditCard",
        sheetId: newSheet.id,
        createdBy: user.id,
      },
    ]);

    revalidatePath("/sheet");
    return { success: true };
  } catch (error) {
    console.error("Error creating sheet:", error);
    return { error: "Failed to create sheet" };
  }
}
