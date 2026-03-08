import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { requireSheetAccess } from "@/lib/auth/sheets";
import { db } from "@/lib/db";
import { paymentTypes } from "@/lib/db/schema";
import PaymentTypeForm, { type PaymentTypeFormData } from "../../add/form";

export default async function EditPaymentTypePage({
  params,
}: {
  params: Promise<{ sheetId: string; paymentTypeId: string }>;
}) {
  const { sheetId, paymentTypeId } = await params;
  await requireSheetAccess(sheetId);

  const [paymentType] = await db
    .select()
    .from(paymentTypes)
    .where(
      and(
        eq(paymentTypes.id, paymentTypeId),
        eq(paymentTypes.sheetId, sheetId),
      ),
    )
    .limit(1);

  if (!paymentType) {
    notFound();
  }

  const initialData: PaymentTypeFormData = {
    id: paymentType.id,
    name: paymentType.name,
    icon: paymentType.icon,
  };

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <Header
        title="Edit Payment Type"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}/settings/payment-types`}
        icon={ArrowLeft}
      />

      <PaymentTypeForm sheetId={sheetId} mode="edit" initialData={initialData} />
    </div>
  );
}
