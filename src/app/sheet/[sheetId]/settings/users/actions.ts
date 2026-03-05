"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sheetInvites, sheetUsers, profiles, sheets } from "@/lib/db/schema";
import {
  buildInviteUrl,
  generateInviteToken,
  getInviteExpiryDate,
  getSheetRoleForUser,
  hashInviteToken,
  isValidRole,
  normalizeEmail,
} from "@/lib/invite-service";
import { sendSheetInviteEmail } from "@/lib/email/send-sheet-invite";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createSheetInvite(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You need to login first." };

  const sheetId = formData.get("sheetId") as string;
  const invitedEmailRaw = formData.get("email") as string;
  const roleRaw = formData.get("role") as string;

  if (!sheetId || !invitedEmailRaw || !roleRaw) {
    return { error: "Email and role are required." };
  }

  if (!isValidRole(roleRaw)) {
    return { error: "Invalid role selected." };
  }
  const role = roleRaw;

  const invitedEmail = normalizeEmail(invitedEmailRaw);
  if (!EMAIL_REGEX.test(invitedEmail)) {
    return { error: "Invalid email format." };
  }

  const inviterRole = await getSheetRoleForUser(sheetId, user.id);
  if (inviterRole !== "admin") {
    return { error: "Only sheet admins can send invites." };
  }

  const existingMember = await db
    .select({ userId: sheetUsers.userId })
    .from(sheetUsers)
    .innerJoin(profiles, eq(sheetUsers.userId, profiles.id))
    .where(
      and(eq(sheetUsers.sheetId, sheetId), eq(profiles.email, invitedEmail)),
    );

  if (existingMember.length > 0) {
    return { error: "That user already has access to this sheet." };
  }

  const token = generateInviteToken();
  const tokenHash = hashInviteToken(token);
  const expiresAt = getInviteExpiryDate();
  const inviteUrl = buildInviteUrl(token);

  const pendingInviteRows = await db
    .select({ id: sheetInvites.id })
    .from(sheetInvites)
    .where(
      and(
        eq(sheetInvites.sheetId, sheetId),
        eq(sheetInvites.invitedEmail, invitedEmail),
        eq(sheetInvites.status, "pending"),
      ),
    );

  if (pendingInviteRows[0]) {
    await db
      .update(sheetInvites)
      .set({
        role,
        tokenHash,
        expiresAt,
        invitedBy: user.id,
        updatedAt: new Date(),
      })
      .where(eq(sheetInvites.id, pendingInviteRows[0].id));
  } else {
    await db.insert(sheetInvites).values({
      sheetId,
      invitedEmail,
      role,
      tokenHash,
      status: "pending",
      invitedBy: user.id,
      expiresAt,
    });
  }

  try {
    const sheetRows = await db
      .select({ name: sheets.name })
      .from(sheets)
      .where(eq(sheets.id, sheetId));
    const sheetName = sheetRows[0]?.name || "a sheet";

    await sendSheetInviteEmail({
      to: invitedEmail,
      sheetName,
      inviterEmail: user.email ? normalizeEmail(user.email) : "A teammate",
      role,
      inviteUrl,
    });
  } catch (error) {
    console.error("Failed to send invite email:", error);
    revalidatePath(`/sheet/${sheetId}/settings/users`);
    return {
      warning: "Invite created but email failed. Share the link manually.",
      inviteUrl,
    };
  }

  revalidatePath(`/sheet/${sheetId}/settings/users`);
  return { success: "Invite sent successfully.", inviteUrl };
}

export async function revokeSheetInvite(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const inviteId = formData.get("inviteId") as string;
  const sheetId = formData.get("sheetId") as string;
  if (!inviteId || !sheetId) return;

  const inviterRole = await getSheetRoleForUser(sheetId, user.id);
  if (inviterRole !== "admin") {
    return;
  }

  await db
    .update(sheetInvites)
    .set({ status: "revoked", updatedAt: new Date() })
    .where(
      and(
        eq(sheetInvites.id, inviteId),
        eq(sheetInvites.sheetId, sheetId),
        eq(sheetInvites.status, "pending"),
      ),
    );

  revalidatePath(`/sheet/${sheetId}/settings/users`);
}

export async function removeSheetUser(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const sheetId = formData.get("sheetId") as string;
  const targetUserId = formData.get("targetUserId") as string;
  if (!sheetId || !targetUserId) return;

  const currentUserRole = await getSheetRoleForUser(sheetId, user.id);
  if (currentUserRole !== "admin") {
    return;
  }

  if (targetUserId === user.id) {
    return;
  }

  const targetMembershipRows = await db
    .select({
      userId: sheetUsers.userId,
      role: sheetUsers.role,
    })
    .from(sheetUsers)
    .where(
      and(eq(sheetUsers.sheetId, sheetId), eq(sheetUsers.userId, targetUserId)),
    );
  const targetMembership = targetMembershipRows[0];

  if (!targetMembership) {
    return;
  }

  if (targetMembership.role === "admin") {
    const sheetAdmins = await db
      .select({ userId: sheetUsers.userId })
      .from(sheetUsers)
      .where(
        and(eq(sheetUsers.sheetId, sheetId), eq(sheetUsers.role, "admin")),
      );

    if (sheetAdmins.length <= 1) {
      return;
    }
  }

  await db
    .delete(sheetUsers)
    .where(
      and(eq(sheetUsers.sheetId, sheetId), eq(sheetUsers.userId, targetUserId)),
    );

  revalidatePath(`/sheet/${sheetId}/settings/users`);
  revalidatePath("/sheet");
}
