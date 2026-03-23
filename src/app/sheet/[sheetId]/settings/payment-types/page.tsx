import { requireSheetAccess } from "@/lib/auth/sheets";
import { PaymentTypesSettingsClient } from "./payment-types-settings-client";

export default async function PaymentTypesSettingsPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const { permissions, sheet } = await requireSheetAccess(sheetId);

  return (
    <PaymentTypesSettingsClient
      sheetId={sheetId}
      sheetName={sheet.name}
      canAddPaymentType={permissions.canAddPaymentType}
      canEditPaymentType={permissions.canEditPaymentType}
    />
  );
}
