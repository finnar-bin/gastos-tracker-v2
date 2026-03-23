import { requireSheetAccess } from "@/lib/auth/sheets";
import { RecurringSettingsClient } from "./recurring-settings-client";

export default async function RecurringTransactionsPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const { permissions, sheet } = await requireSheetAccess(sheetId);

  return (
    <RecurringSettingsClient
      sheetId={sheetId}
      sheetName={sheet.name}
      canAddRecurringTransaction={permissions.canAddRecurringTransaction}
      canEditRecurringTransaction={permissions.canEditRecurringTransaction}
    />
  );
}
