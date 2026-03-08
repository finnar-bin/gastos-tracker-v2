import { requireSheetPermission } from "@/lib/auth/sheets";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { categories, paymentTypes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import RecurringTransactionForm from "./form";
import { Header } from "@/components/Header";

export default async function AddRecurringPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  await requireSheetPermission(sheetId, "canAddRecurringTransaction");

  const availableCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.sheetId, sheetId));

  const availablePaymentTypes = await db
    .select()
    .from(paymentTypes)
    .where(eq(paymentTypes.sheetId, sheetId));

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <Header
        title="New Recurring"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}/settings/recurring`}
        icon={ArrowLeft}
      />

      <RecurringTransactionForm
        sheetId={sheetId}
        categories={availableCategories}
        paymentTypes={availablePaymentTypes}
      />
    </div>
  );
}
