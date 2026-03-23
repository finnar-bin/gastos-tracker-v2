"use client";

import { useState } from "react";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { InviteUserDialog } from "./invite-user-dialog";
import { UsersList } from "./users-list";

export function ManageUsersClient({
  sheetId,
  sheetName,
  currentUserId,
  canManageInvites,
}: {
  sheetId: string;
  sheetName: string;
  currentUserId: string;
  canManageInvites: boolean;
}) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <Header
        title="Manage Users"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}/settings`}
        icon={ArrowLeft}
        subtitle={sheetName}
        actions={
          canManageInvites ? (
            <Button
              size="sm"
              className="gap-2"
              type="button"
              onClick={() => setInviteDialogOpen(true)}
            >
              <UserPlus className="h-4 w-4" /> Invite
            </Button>
          ) : (
            <Button size="sm" className="gap-2" disabled>
              Invite
            </Button>
          )
        }
      />

      {inviteDialogOpen ? (
        <InviteUserDialog
          sheetId={sheetId}
          open={inviteDialogOpen}
          onOpenChangeAction={setInviteDialogOpen}
        />
      ) : null}

      <UsersList
        sheetId={sheetId}
        currentUserId={currentUserId}
        canManageInvites={canManageInvites}
      />
    </div>
  );
}
