"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { acceptInviteById, declineInviteById, getInviteByToken } from "@/lib/invite-service";

export async function acceptInviteFromLanding(formData: FormData) {
  const token = formData.get("token") as string;
  if (!token) redirect("/sheet");

  const invite = await getInviteByToken(token);
  if (!invite) redirect("/sheet");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  const result = await acceptInviteById({
    inviteId: invite.id,
    userId: user.id,
    userEmail: user.email,
  });

  revalidatePath("/sheet");

  if (result.ok) {
    redirect(`/sheet/${result.sheetId}`);
  }

  redirect(`/invite/${token}`);
}

export async function declineInviteFromLanding(formData: FormData) {
  const token = formData.get("token") as string;
  if (!token) redirect("/sheet");

  const invite = await getInviteByToken(token);
  if (!invite) redirect("/sheet");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  await declineInviteById({
    inviteId: invite.id,
    userEmail: user.email,
  });

  revalidatePath("/sheet");
  redirect("/sheet");
}
