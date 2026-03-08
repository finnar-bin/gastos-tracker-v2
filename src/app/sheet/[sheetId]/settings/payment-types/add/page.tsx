import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { requireSheetPermission } from "@/lib/auth/sheets";
import PaymentTypeForm from "./form";

export default async function AddPaymentTypePage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  await requireSheetPermission(sheetId, "canAddPaymentType");

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <Header
        title="New Payment Type"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}/settings/payment-types`}
        icon={ArrowLeft}
      />

      <PaymentTypeForm sheetId={sheetId} />
    </div>
  );
}
