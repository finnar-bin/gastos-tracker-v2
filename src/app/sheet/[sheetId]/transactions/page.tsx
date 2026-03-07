import { requireSheetAccess } from "@/lib/auth/sheets";
import { db } from "@/lib/db";
import { categories, transactions } from "@/lib/db/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { FormattedAmount } from "@/components/formatted-amount";
import { getLucideIcon } from "@/lib/lucide-icons";
import { LayoutGrid, LayoutList } from "lucide-react";
import { Header } from "@/components/Header";
import { TransactionsFilter } from "./filter";

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export default async function YearOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ sheetId: string }>;
  searchParams: Promise<{
    month?: string;
    year?: string;
    type?: string;
  }>;
}) {
  const { sheetId } = await params;
  const { month, year, type } = await searchParams;
  await requireSheetAccess(sheetId);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const parsedYear = Number.parseInt(year ?? "", 10);
  const parsedMonth = Number.parseInt(month ?? "", 10);

  const selectedYear = Number.isFinite(parsedYear) ? parsedYear : currentYear;
  const selectedMonth =
    Number.isFinite(parsedMonth) && parsedMonth >= 0 && parsedMonth <= 11
      ? parsedMonth
      : currentMonth;
  const selectedType =
    type === "income" || type === "expense" ? type : "expense";

  const startDate = toIsoDate(new Date(selectedYear, selectedMonth, 1));
  const endDate = toIsoDate(new Date(selectedYear, selectedMonth + 1, 0));

  const categoryTotals = await db
    .select({
      id: categories.id,
      name: categories.name,
      icon: categories.icon,
      totalAmount: sql<string>`coalesce(sum(${transactions.amount}), 0)`,
    })
    .from(categories)
    .leftJoin(
      transactions,
      and(
        eq(transactions.categoryId, categories.id),
        eq(transactions.sheetId, sheetId),
        eq(transactions.type, selectedType),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
      ),
    )
    .where(
      and(eq(categories.sheetId, sheetId), eq(categories.type, selectedType)),
    )
    .groupBy(categories.id, categories.name, categories.icon)
    .orderBy(categories.name);

  return (
    <div className="container max-w-md mx-auto p-4 h-dvh flex flex-col gap-6 overflow-hidden">
      <Header
        title="Transactions"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}`}
        icon={LayoutList}
      />

      <TransactionsFilter
        month={selectedMonth}
        year={selectedYear}
        sheetId={sheetId}
        type={selectedType}
      />

      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
        {categoryTotals.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">
            No {selectedType} categories found.
          </p>
        ) : (
          categoryTotals.map((category) => {
            const Icon = getLucideIcon(category.icon) || LayoutGrid;
            return (
              <Card key={category.id} className="shadow-sm">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center text-xl ${
                        selectedType === "expense"
                          ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="font-medium">{category.name}</p>
                  </div>
                  <div className="font-bold text-foreground">
                    <FormattedAmount
                      amount={category.totalAmount}
                      showSign={false}
                    />
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
