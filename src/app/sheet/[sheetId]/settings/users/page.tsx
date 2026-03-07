import { requireSheetAccess } from "@/lib/auth/sheets";
import { ArrowLeft, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { sheetUsers, profiles, sheetInvites } from "@/lib/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { InviteUserDialog } from "./invite-user-dialog";
import { revokeSheetInvite } from "./actions";
import { RemoveUserButton } from "./remove-user-button";
import { Header } from "@/components/Header";
import { UserAvatar } from "@/components/user-avatar";

export default async function ManageUsersPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const { user } = await requireSheetAccess(sheetId);

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

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <Header
        title="Manage Users"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}/settings`}
        icon={ArrowLeft}
        actions={
          canManageInvites ? (
            <InviteUserDialog sheetId={sheetId} />
          ) : (
            <Button size="sm" className="gap-2" disabled>
              Invite
            </Button>
          )
        }
      />

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
              className="overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <CardContent className="px-4 flex justify-between items-center">
                <div className="flex w-full items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      email={member.email}
                      displayName={member.displayName}
                      avatarUrl={member.avatarUrl}
                      size="lg"
                    />
                    <div>
                      <div className="font-medium">
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
