import { and, eq, sql } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";
import {
  sheetInvites,
  sheetUsers,
  sheets,
  userRoleEnum,
} from "@/lib/db/schema";

const INVITE_EXPIRY_DAYS = 7;

export type InviteRole = (typeof userRoleEnum.enumValues)[number];

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateInviteToken() {
  return randomBytes(32).toString("hex");
}

export function getInviteExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);
  return expiresAt;
}

export function buildInviteUrl(token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return `${baseUrl}/invite/${token}`;
}

export function isValidRole(role: string): role is InviteRole {
  return userRoleEnum.enumValues.includes(role as InviteRole);
}

export async function getSheetRoleForUser(sheetId: string, userId: string) {
  const rows = await db
    .select({ role: sheetUsers.role })
    .from(sheetUsers)
    .where(and(eq(sheetUsers.sheetId, sheetId), eq(sheetUsers.userId, userId)));

  return rows[0]?.role ?? null;
}

export async function getInviteByToken(token: string) {
  const tokenHash = hashInviteToken(token);
  const rows = await db
    .select({
      id: sheetInvites.id,
      sheetId: sheetInvites.sheetId,
      invitedEmail: sheetInvites.invitedEmail,
      role: sheetInvites.role,
      status: sheetInvites.status,
      expiresAt: sheetInvites.expiresAt,
      sheetName: sheets.name,
      isExpired: sql<boolean>`${sheetInvites.expiresAt} <= now()`,
    })
    .from(sheetInvites)
    .innerJoin(sheets, eq(sheetInvites.sheetId, sheets.id))
    .where(eq(sheetInvites.tokenHash, tokenHash));

  return rows[0] ?? null;
}

export async function acceptInviteById(args: {
  inviteId: string;
  userId: string;
  userEmail: string;
}) {
  const rows = await db
    .select({
      id: sheetInvites.id,
      sheetId: sheetInvites.sheetId,
      invitedEmail: sheetInvites.invitedEmail,
      role: sheetInvites.role,
      status: sheetInvites.status,
      expiresAt: sheetInvites.expiresAt,
    })
    .from(sheetInvites)
    .where(eq(sheetInvites.id, args.inviteId));
  const invite = rows[0];

  if (!invite) return { ok: false as const, reason: "not_found" };
  if (invite.status !== "pending")
    return { ok: false as const, reason: "not_pending" };

  if (invite.expiresAt.getTime() <= Date.now()) {
    await db
      .update(sheetInvites)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(sheetInvites.id, invite.id));
    return { ok: false as const, reason: "expired" };
  }

  if (normalizeEmail(args.userEmail) !== invite.invitedEmail) {
    return { ok: false as const, reason: "email_mismatch" };
  }

  await db.transaction(async (tx) => {
    await tx
      .insert(sheetUsers)
      .values({
        sheetId: invite.sheetId,
        userId: args.userId,
        role: invite.role,
      })
      .onConflictDoNothing({ target: [sheetUsers.sheetId, sheetUsers.userId] });

    await tx
      .update(sheetInvites)
      .set({
        status: "accepted",
        acceptedBy: args.userId,
        acceptedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(sheetInvites.id, invite.id));
  });

  return { ok: true as const, sheetId: invite.sheetId };
}

export async function declineInviteById(args: {
  inviteId: string;
  userEmail: string;
}) {
  const rows = await db
    .select({
      id: sheetInvites.id,
      invitedEmail: sheetInvites.invitedEmail,
      status: sheetInvites.status,
    })
    .from(sheetInvites)
    .where(eq(sheetInvites.id, args.inviteId));
  const invite = rows[0];

  if (!invite) return { ok: false as const, reason: "not_found" };
  if (invite.status !== "pending")
    return { ok: false as const, reason: "not_pending" };

  if (normalizeEmail(args.userEmail) !== invite.invitedEmail) {
    return { ok: false as const, reason: "email_mismatch" };
  }

  await db
    .update(sheetInvites)
    .set({
      status: "declined",
      updatedAt: new Date(),
    })
    .where(eq(sheetInvites.id, invite.id));

  return { ok: true as const };
}
