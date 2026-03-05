import { requireSheetAccess } from "@/lib/auth/sheets";
import { ArrowLeft, Mail, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { sheetUsers, profiles, sheetInvites } from "@/lib/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { createHash } from "crypto";
import { InviteUserDialog } from "./invite-user-dialog";
import { revokeSheetInvite } from "./actions";
import { RemoveUserButton } from "./remove-user-button";

export default async function ManageUsersPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const { sheet, user } = await requireSheetAccess(sheetId);

  const currentUserRoleRows = await db
    .select({ role: sheetUsers.role })
    .from(sheetUsers)
    .where(
      and(eq(sheetUsers.sheetId, sheetId), eq(sheetUsers.userId, user.id)),
    );
  const canManageInvites = currentUserRoleRows[0]?.role === "admin";

  const members = await db
    .select({
      id: profiles.id,
      email: profiles.email,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      role: sheetUsers.role,
    })
    .from(sheetUsers)
    .innerJoin(profiles, eq(sheetUsers.userId, profiles.id))
    .where(eq(sheetUsers.sheetId, sheetId));

  const pendingInvites = await db
    .select({
      id: sheetInvites.id,
      email: sheetInvites.invitedEmail,
      role: sheetInvites.role,
      expiresAt: sheetInvites.expiresAt,
      createdAt: sheetInvites.createdAt,
    })
    .from(sheetInvites)
    .where(
      and(
        eq(sheetInvites.sheetId, sheetId),
        eq(sheetInvites.status, "pending"),
        gt(sheetInvites.expiresAt, new Date()),
      ),
    );

  const getGravatarUrl = (email: string) => {
    const hash = createHash("md5")
      .update(email.trim().toLowerCase())
      .digest("hex");
    return `https://www.gravatar.com/avatar/${hash}?d=mp`;
  };

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={`/sheet/${sheetId}/settings`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Manage Users</h1>
            <p className="text-sm text-muted-foreground">{sheet.name}</p>
          </div>
        </div>
        {canManageInvites ? (
          <InviteUserDialog sheetId={sheetId} />
        ) : (
          <Button size="sm" className="gap-2" disabled>
            Invite
          </Button>
        )}
      </div>

      {pendingInvites.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Pending Invites
          </h2>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <Card key={invite.id} className="border-dashed">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{invite.email}</div>
                    <div className="text-xs text-muted-foreground">
                      Role: <span className="capitalize">{invite.role}</span> ·
                      Expires {invite.expiresAt.toLocaleDateString()}
                    </div>
                  </div>
                  {canManageInvites ? (
                    <form action={revokeSheetInvite}>
                      <input type="hidden" name="inviteId" value={invite.id} />
                      <input type="hidden" name="sheetId" value={sheetId} />
                      <Button size="sm" variant="outline">
                        Revoke
                      </Button>
                    </form>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {members.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
            <p className="text-muted-foreground">No users found.</p>
          </div>
        ) : (
          members.map((member) => (
            <Card
              key={member.id}
              className="overflow-hidden border-none shadow-sm bg-card"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={member.avatarUrl || getGravatarUrl(member.email)}
                        alt={member.displayName || member.email}
                      />
                      <AvatarFallback>
                        {member.displayName?.charAt(0).toUpperCase() ||
                          member.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">
                        {member.displayName || "User"}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {member.email}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary capitalize">
                      <Shield className="h-3 w-3" />
                      {member.role}
                    </div>
                    {canManageInvites && member.id !== user.id ? (
                      <div className="mt-2">
                        <RemoveUserButton
                          sheetId={sheetId}
                          targetUserId={member.id}
                          targetLabel={member.displayName || member.email}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
