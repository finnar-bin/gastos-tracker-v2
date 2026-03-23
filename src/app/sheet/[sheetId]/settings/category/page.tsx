import { requireSheetAccess } from "@/lib/auth/sheets";
import { CategorySettingsClient } from "./category-settings-client";

export default async function CategorySettingsPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const { permissions, sheet } = await requireSheetAccess(sheetId);

  return (
    <CategorySettingsClient
      sheetId={sheetId}
      sheetName={sheet.name}
      canAddCategory={permissions.canAddCategory}
      canEditCategory={permissions.canEditCategory}
    />
  );
}
