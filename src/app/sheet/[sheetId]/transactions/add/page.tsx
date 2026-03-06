import { requireSheetAccess } from "@/lib/auth/sheets";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { db } from "@/lib/db";
import { categories, paymentTypes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ArrowDownCircle, ArrowUpCircle, ReceiptText } from "lucide-react";
import TransactionForm from "./form";

export default async function AddTransactionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sheetId: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { sheetId } = await params;
  const { sheet } = await requireSheetAccess(sheetId);
  const selectedSheetId = sheet.id;

  const { type: queryType } = await searchParams;
  const normalizedType = queryType?.toLowerCase();
  const type =
    normalizedType === "income" || normalizedType === "expense"
      ? normalizedType
      : null;

  if (!type) {
    return (
      <div className="container max-w-md mx-auto p-4 flex items-center justify-center min-h-[80vh]">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ReceiptText className="h-4 w-4" />
              Select Transaction Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link
              href={`/sheet/${selectedSheetId}/transactions/add?type=expense`}
              className="block rounded-lg border p-4 transition-colors hover:bg-accent/70"
            >
              <div className="flex items-center gap-3">
                <ArrowDownCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium">Expense</p>
                  <p className="text-sm text-muted-foreground">
                    Record money going out
                  </p>
                </div>
              </div>
            </Link>
            <Link
              href={`/sheet/${selectedSheetId}/transactions/add?type=income`}
              className="block rounded-lg border p-4 transition-colors hover:bg-accent/70"
            >
              <div className="flex items-center gap-3">
                <ArrowUpCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Income</p>
                  <p className="text-sm text-muted-foreground">
                    Record money coming in
                  </p>
                </div>
              </div>
            </Link>
            <div className="pt-2 space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/sheet/${selectedSheetId}`}>Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 1. Get categories for the sheet
  const availableCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.sheetId, selectedSheetId));

  const availablePaymentTypes = await db
    .select()
    .from(paymentTypes)
    .where(eq(paymentTypes.sheetId, selectedSheetId));

  const filteredCategories = availableCategories.filter(
    (cat) => cat.type === type,
  );

  return (
    <div className="container max-w-md mx-auto p-4 flex items-center justify-center min-h-[80vh]">
      <TransactionForm
        sheetId={selectedSheetId}
        categories={filteredCategories}
        paymentTypes={availablePaymentTypes}
        transactionType={type}
        cancelHref={`/sheet/${selectedSheetId}`}
      />
    </div>
  );
}
