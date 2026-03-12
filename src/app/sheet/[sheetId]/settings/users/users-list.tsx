"use client";

import { useQuery } from "@tanstack/react-query";
import { Mail, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { createClient } from "@/lib/supabase/client";
import { RemoveUserButton } from "./remove-user-button";
import { revokeSheetInvite } from "./actions";

type SheetUserRow = {
  user_id: string;
  role: string;
};

type ProfileRow = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
};

type InviteRow = {
  id: string;
  invited_email: string;
  role: string;
  expires_at: string;
};

const supabase = createClient();

export function UsersList({
  sheetId,
  currentUserId,
  canManageInvites,
}: {
  sheetId: string;
  currentUserId: string;
  canManageInvites: boolean;
}) {
  const usersQuery = useQuery({
    queryKey: ["sheet", sheetId, "users"],
    queryFn: async () => {
      const [membershipsResult, pendingInvitesResult] = await Promise.all([
        supabase.from("sheet_users").select("user_id, role").eq("sheet_id", sheetId),
        supabase
          .from("sheet_invites")
          .select("id, invited_email, role, expires_at")
          .eq("sheet_id", sheetId)
          .eq("status", "pending")
          .gt("expires_at", new Date().toISOString()),
      ]);

      if (membershipsResult.error) throw membershipsResult.error;
      if (pendingInvitesResult.error) throw pendingInvitesResult.error;

      const memberships = (membershipsResult.data ?? []) as SheetUserRow[];
      const userIds = memberships.map((member) => member.user_id);
      const profilesResult =
        userIds.length > 0
          ? await supabase
              .from("profiles")
              .select("id, email, display_name, avatar_url")
              .in("id", userIds)
          : { data: [], error: null };

      if (profilesResult.error) throw profilesResult.error;

      const profilesById = new Map(
        ((profilesResult.data ?? []) as ProfileRow[]).map((profile) => [
          profile.id,
          profile,
        ]),
      );

      const members = memberships.map((member) => {
        const profile = profilesById.get(member.user_id);
        return {
          id: member.user_id,
          email: profile?.email ?? "",
          displayName: profile?.display_name ?? null,
          avatarUrl: profile?.avatar_url ?? null,
          role: member.role,
        };
      });

      return {
        members,
        pendingInvites: (pendingInvitesResult.data ?? []) as InviteRow[],
      };
    },
  });

  if (usersQuery.isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }, (_, idx) => (
          <div key={idx} className="h-20 rounded-xl bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (usersQuery.error) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">Failed to load users.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => void usersQuery.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const members = usersQuery.data?.members ?? [];
  const pendingInvites = usersQuery.data?.pendingInvites ?? [];

  return (
    <>
      {pendingInvites.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Pending Invites
          </h2>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <Card key={invite.id} className="border-dashed">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{invite.invited_email}</div>
                    <div className="text-xs text-muted-foreground">
                      Role: <span className="capitalize">{invite.role}</span> ·
                      Expires {new Date(invite.expires_at).toLocaleDateString()}
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
      ) : null}

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
                      <div className="font-medium">{member.displayName || "User"}</div>
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
                    {canManageInvites && member.id !== currentUserId ? (
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
    </>
  );
}
