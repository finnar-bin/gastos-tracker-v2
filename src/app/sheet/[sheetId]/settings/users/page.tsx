import { requireSheetAccess } from "@/lib/auth/sheets";
import { ManageUsersClient } from "./manage-users-client";

export default async function ManageUsersPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const { user, permissions, sheet } = await requireSheetAccess(sheetId);
  const canManageInvites = permissions.canManageUsers;

  return (
    <ManageUsersClient
      sheetId={sheetId}
      sheetName={sheet.name}
      currentUserId={user.id}
      canManageInvites={canManageInvites}
    />
  );
}
