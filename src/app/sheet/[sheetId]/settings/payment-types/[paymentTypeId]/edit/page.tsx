import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { requireSheetPermission } from "@/lib/auth/sheets";
import { PaymentTypeFormLoader } from "../../payment-type-form-loader";

export default async function EditPaymentTypePage({
  params,
}: {
  params: Promise<{ sheetId: string; paymentTypeId: string }>;
}) {
  const { sheetId, paymentTypeId } = await params;
  const { sheet } = await requireSheetPermission(
    sheetId,
    "canEditPaymentType",
  );

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <Header
        title="Edit Payment Type"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}/settings/payment-types`}
        icon={ArrowLeft}
        subtitle={sheet.name}
      />

      <PaymentTypeFormLoader sheetId={sheetId} paymentTypeId={paymentTypeId} />
    </div>
  );
}
