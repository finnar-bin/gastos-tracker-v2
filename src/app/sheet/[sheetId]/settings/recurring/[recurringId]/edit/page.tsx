import { requireSheetAccess } from "@/lib/auth/sheets";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  categories,
  paymentTypes,
  recurringTransactions,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import RecurringTransactionForm, {
  RecurringTransactionData,
} from "../../add/form";
import { notFound } from "next/navigation";

export default async function EditRecurringPage({
  params,
}: {
  params: Promise<{ sheetId: string; recurringId: string }>;
}) {
  const { sheetId, recurringId } = await params;
  const { sheet } = await requireSheetAccess(sheetId);

  const [recurring] = await db
    .select()
    .from(recurringTransactions)
    .where(
      and(
        eq(recurringTransactions.id, recurringId),
        eq(recurringTransactions.sheetId, sheetId),
      ),
    );

  if (!recurring) {
    notFound();
  }

  const availableCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.sheetId, sheetId));

  const availablePaymentTypes = await db
    .select()
    .from(paymentTypes)
    .where(eq(paymentTypes.sheetId, sheetId));

  const initialData: RecurringTransactionData = {
    id: recurring.id,
    amount: recurring.amount,
    type: recurring.type as "income" | "expense",
    description: recurring.description,
    frequency: recurring.frequency,
    dayOfMonth: recurring.dayOfMonth,
    categoryId: recurring.categoryId,
    paymentType: recurring.paymentType ?? "",
  };

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <div className="flex items-center gap-2">
        <Link href={`/sheet/${sheetId}/settings/recurring`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Edit Recurring</h1>
          <p className="text-sm text-muted-foreground">{sheet.name}</p>
        </div>
      </div>

      <RecurringTransactionForm
        sheetId={sheetId}
        categories={availableCategories}
        paymentTypes={availablePaymentTypes}
        mode="edit"
        initialData={initialData}
      />
    </div>
  );
}
