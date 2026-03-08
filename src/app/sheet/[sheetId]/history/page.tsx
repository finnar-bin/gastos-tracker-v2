import { requireSheetAccess } from "@/lib/auth/sheets";
import { db } from "@/lib/db";
import {
  transactions,
  categories,
  paymentTypes,
  profiles,
} from "@/lib/db/schema";
import { desc, eq, and, gte, lte } from "drizzle-orm";
import { History } from "lucide-react";
import { HistoryFilter } from "./filter";
import { Header } from "@/components/Header";
import { TransactionCard } from "@/components/transaction-card";
import { getSheetCurrency } from "@/lib/sheet-settings";

export default async function HistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ sheetId: string }>;
  searchParams: Promise<{
    month?: string;
    year?: string;
    type?: string;
    categoryId?: string;
  }>;
}) {
  const { sheetId } = await params;
  const { user } = await requireSheetAccess(sheetId);
  const sheetCurrency = await getSheetCurrency(sheetId);
  const { month, year, type, categoryId } = await searchParams;

  const currentYear = new Date().getFullYear();
  const selectedYear = year ? parseInt(year) : currentYear;
  const selectedMonth = month ? parseInt(month) : new Date().getMonth();
  const selectedType = type === "income" || type === "expense" ? type : null;
  const selectedCategoryId = categoryId ?? null;

  // Build query
  const startDate = new Date(selectedYear, selectedMonth, 1);
  const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
  const filterConditions = [
    eq(transactions.createdBy, user.id),
    eq(transactions.sheetId, sheetId),
    gte(transactions.date, startDate.toISOString().split("T")[0]),
    lte(transactions.date, endDate.toISOString().split("T")[0]),
  ];

  if (selectedType) {
    filterConditions.push(eq(transactions.type, selectedType));
  }

  if (selectedCategoryId) {
    filterConditions.push(eq(transactions.categoryId, selectedCategoryId));
  }

  const availableCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      type: categories.type,
    })
    .from(categories)
    .where(eq(categories.sheetId, sheetId))
    .orderBy(categories.name);

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
      creatorDisplayName: profiles.displayName,
      creatorEmail: profiles.email,
      creatorAvatarUrl: profiles.avatarUrl,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(paymentTypes, eq(transactions.paymentType, paymentTypes.id))
    .leftJoin(profiles, eq(transactions.createdBy, profiles.id))
    .where(and(...filterConditions))
    .orderBy(desc(transactions.date));

  const returnParams = new URLSearchParams({
    month: selectedMonth.toString(),
    year: selectedYear.toString(),
  });
  if (selectedType) {
    returnParams.set("type", selectedType);
  }
  if (selectedCategoryId) {
    returnParams.set("categoryId", selectedCategoryId);
  }
  const returnTo = `/sheet/${sheetId}/history?${returnParams.toString()}`;

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 min-h-screen relative">
      <Header
        title="History"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}`}
        icon={History}
      />

      {/* Filters */}
      <HistoryFilter
        month={selectedMonth}
        year={selectedYear}
        sheetId={sheetId}
        type={selectedType}
        categoryId={selectedCategoryId}
        categories={
          selectedType
            ? availableCategories.filter(
                (category) => category.type === selectedType,
              )
            : availableCategories
        }
      />

      {/* Transaction List */}
      <div className="space-y-3">
        {txs.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No transactions found for this period.
          </p>
        ) : (
          txs.map((tx) => (
            <TransactionCard
              key={tx.id}
              sheetId={sheetId}
              tx={tx}
              returnTo={returnTo}
              currency={sheetCurrency}
            />
          ))
        )}
      </div>
    </div>
  );
}
