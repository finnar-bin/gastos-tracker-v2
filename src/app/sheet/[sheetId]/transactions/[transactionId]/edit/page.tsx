import { requireSheetAccess } from "@/lib/auth/sheets";
import { Header } from "@/components/Header";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { categories, paymentTypes, transactions } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import TransactionForm, { TransactionData } from "../../add/form";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ sheetId: string; transactionId: string }>;
}) {
  const { sheetId, transactionId } = await params;
  const { user } = await requireSheetAccess(sheetId);

  const [transaction] = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.id, transactionId),
        eq(transactions.sheetId, sheetId),
        eq(transactions.createdBy, user.id),
      ),
    );

  if (!transaction) {
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

  const filteredCategories = availableCategories.filter(
    (category) => category.type === transaction.type,
  );

  const initialData: TransactionData = {
    id: transaction.id,
    amount: transaction.amount,
    type: transaction.type as "income" | "expense",
    description: transaction.description,
    date: transaction.date,
    categoryId: transaction.categoryId,
    paymentType: transaction.paymentType,
  };

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <Header
        title="Edit Transaction"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}/history`}
        icon={ArrowLeft}
      />

      <TransactionForm
        sheetId={sheetId}
        categories={filteredCategories}
        paymentTypes={availablePaymentTypes}
        mode="edit"
        initialData={initialData}
        cancelHref={`/sheet/${sheetId}/history`}
      />
    </div>
  );
}
