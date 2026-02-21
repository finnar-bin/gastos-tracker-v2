import { requireSheetAccess } from "@/lib/auth/sheets";
import { db } from "@/lib/db";
import { transactions, categories, paymentTypes } from "@/lib/db/schema";
import { desc, eq, and, gte, lte } from "drizzle-orm";
import * as LucideIcons from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { HistoryFilter } from "./filter";

export default async function HistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ sheetId: string }>;
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const { sheetId } = await params;
  const { user } = await requireSheetAccess(sheetId);
  const { month, year } = await searchParams;

  const currentYear = new Date().getFullYear();
  const selectedYear = year ? parseInt(year) : currentYear;
  const selectedMonth = month ? parseInt(month) : new Date().getMonth();

  // Build query
  const startDate = new Date(selectedYear, selectedMonth, 1);
  const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

  // Fetch transactions joined with categories and payment types
  const txs = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      type: transactions.type,
      description: transactions.description,
      date: transactions.date,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      paymentTypeName: paymentTypes.name,
      paymentTypeIcon: paymentTypes.icon,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(paymentTypes, eq(transactions.paymentType, paymentTypes.id))
    .where(
      and(
        eq(transactions.createdBy, user.id),
        eq(transactions.sheetId, sheetId),
        gte(transactions.date, startDate.toISOString().split("T")[0]),
        lte(transactions.date, endDate.toISOString().split("T")[0]),
      ),
    )
    .orderBy(desc(transactions.date));

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 min-h-screen relative">
      <div className="flex items-center gap-2">
        <Link href={`/sheet/${sheetId}`}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">History</h1>
      </div>

      {/* Filters */}
      <HistoryFilter
        month={selectedMonth}
        year={selectedYear}
        sheetId={sheetId}
      />

      {/* Transaction List */}
      <div className="space-y-3">
        {txs.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No transactions found for this period.
          </p>
        ) : (
          txs.map((tx) => {
            const PaymentIcon = tx.paymentTypeIcon
              ? (LucideIcons as any)[tx.paymentTypeIcon]
              : null;
            return (
              <Card key={tx.id} className="overflow-hidden shadow-sm">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center text-xl ${
                        tx.type === "expense"
                          ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                      }`}
                    >
                      {tx.categoryIcon}
                    </div>
                    <div>
                      <p className="font-medium capitalize flex items-center gap-2">
                        {tx.description || tx.categoryName}
                        {PaymentIcon && (
                          <span
                            className="bg-secondary text-secondary-foreground p-1 rounded-md"
                            title={tx.paymentTypeName || "Payment Method"}
                          >
                            <PaymentIcon className="w-3 h-3" />
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`font-bold ${tx.type === "expense" ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
                  >
                    {tx.type === "expense" ? "-" : "+"}$
                    {parseFloat(tx.amount).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
