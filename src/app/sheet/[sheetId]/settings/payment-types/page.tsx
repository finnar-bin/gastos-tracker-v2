import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { requireSheetAccess } from "@/lib/auth/sheets";
import { PaymentTypeList } from "./payment-type-list";

export default async function PaymentTypesSettingsPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const { permissions, sheet } = await requireSheetAccess(sheetId);

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <Header
        title="Payment Types"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}/settings`}
        icon={ArrowLeft}
        subtitle={sheet.name}
        actions={
          permissions.canAddPaymentType ? (
            <Link href={`/sheet/${sheetId}/settings/payment-types/add`}>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </Link>
          ) : null
        }
      />

      <PaymentTypeList
        sheetId={sheetId}
        canAddPaymentType={permissions.canAddPaymentType}
        canEditPaymentType={permissions.canEditPaymentType}
      />
    </div>
  );
}
