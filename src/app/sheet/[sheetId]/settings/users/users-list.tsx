"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Mail, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackgroundSyncIndicator } from "@/components/background-sync-indicator";
import { UserAvatar } from "@/components/user-avatar";
import { queryKeys } from "@/lib/query-keys";
import { fetchSheetMemberDirectory } from "@/lib/sheet-member-directory";
import { createClient } from "@/lib/supabase/client";
import { RemoveUserButton } from "./remove-user-button";
import { revokeSheetInvite } from "./actions";

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
  const queryClient = useQueryClient();
  const [revokingInviteId, setRevokingInviteId] = useState<string | null>(null);

  async function handleRevokeInvite(
    event: React.FormEvent<HTMLFormElement>,
    inviteId: string,
  ) {
    event.preventDefault();
    setRevokingInviteId(inviteId);

    const formData = new FormData(event.currentTarget);
    await revokeSheetInvite(formData);
    await queryClient.invalidateQueries({ queryKey: queryKeys.users(sheetId) });

    setRevokingInviteId(null);
  }

  const usersQuery = useQuery({
    queryKey: queryKeys.users(sheetId),
    queryFn: async () => {
      const [memberDirectory, pendingInvitesResult] = await Promise.all([
        fetchSheetMemberDirectory(sheetId),
        supabase
          .from("sheet_invites")
          .select("id, invited_email, role, expires_at")
          .eq("sheet_id", sheetId)
          .eq("status", "pending")
          .gt("expires_at", new Date().toISOString()),
      ]);

      if (pendingInvitesResult.error) throw pendingInvitesResult.error;

      return {
        members: memberDirectory,
        pendingInvites: (pendingInvitesResult.data ?? []) as InviteRow[],
      };
    },
  });

  if (usersQuery.isLoading && !usersQuery.data) {
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
  const isRefreshing = usersQuery.isFetching;

  return (
    <div className="relative space-y-4">
      <BackgroundSyncIndicator active={isRefreshing} />
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
                    <form onSubmit={(event) => void handleRevokeInvite(event, invite.id)}>
                      <input type="hidden" name="inviteId" value={invite.id} />
                      <input type="hidden" name="sheetId" value={sheetId} />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={revokingInviteId === invite.id}
                      >
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
                          targetLabel={member.displayName || member.email || "User"}
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
