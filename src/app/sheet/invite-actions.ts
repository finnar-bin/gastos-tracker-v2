"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { acceptInviteById, declineInviteById } from "@/lib/invite-service";

export async function acceptInviteFromSheet(formData: FormData) {
  const inviteId = formData.get("inviteId") as string;
  if (!inviteId) redirect("/sheet");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login?next=/sheet");
  }

  const result = await acceptInviteById({
    inviteId,
    userId: user.id,
    userEmail: user.email,
  });

  revalidatePath("/sheet");

  if (result.ok) {
    redirect(`/sheet/${result.sheetId}`);
  }

  redirect("/sheet");
}

export async function declineInviteFromSheet(formData: FormData) {
  const inviteId = formData.get("inviteId") as string;
  if (!inviteId) redirect("/sheet");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login?next=/sheet");
  }

  await declineInviteById({
    inviteId,
    userEmail: user.email,
  });

  revalidatePath("/sheet");
  redirect("/sheet");
}
