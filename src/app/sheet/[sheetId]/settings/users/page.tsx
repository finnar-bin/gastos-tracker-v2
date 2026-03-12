import { requireSheetAccess } from "@/lib/auth/sheets";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InviteUserDialog } from "./invite-user-dialog";
import { Header } from "@/components/Header";
import { UsersList } from "./users-list";
import { getSheetMemberProfiles } from "@/lib/sheet-member-profiles";

export default async function ManageUsersPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const { user, permissions, sheet } = await requireSheetAccess(sheetId);
  const canManageInvites = permissions.canManageUsers;
  const memberProfiles = await getSheetMemberProfiles(sheetId);

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <Header
        title="Manage Users"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}/settings`}
        icon={ArrowLeft}
        subtitle={sheet.name}
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

      <UsersList
        sheetId={sheetId}
        currentUserId={user.id}
        canManageInvites={canManageInvites}
        memberProfiles={memberProfiles}
      />
    </div>
  );
}
