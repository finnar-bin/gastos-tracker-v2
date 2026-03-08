import { notFound } from "next/navigation";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { LayoutGrid } from "lucide-react";
import { requireSheetAccess } from "@/lib/auth/sheets";
import { db } from "@/lib/db";
import {
  categories,
  paymentTypes,
  profiles,
  transactions,
} from "@/lib/db/schema";
import { Header } from "@/components/Header";
import { TransactionCard } from "@/components/transaction-card";
import { getLucideIcon } from "@/lib/lucide-icons";
import { getSheetCurrency } from "@/lib/sheet-settings";

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export default async function CategoryTransactionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ sheetId: string; transactionId: string }>;
  searchParams: Promise<{
    month?: string;
    year?: string;
    type?: string;
  }>;
}) {
  const { sheetId, transactionId } = await params;
  const { month, year, type } = await searchParams;
  await requireSheetAccess(sheetId);
  const sheetCurrency = await getSheetCurrency(sheetId);

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
  const selectedType = type === "income" || type === "expense" ? type : null;

  const startDate = toIsoDate(new Date(selectedYear, selectedMonth, 1));
  const endDate = toIsoDate(new Date(selectedYear, selectedMonth + 1, 0));

  const [category] = await db
    .select({
      id: categories.id,
      name: categories.name,
      type: categories.type,
      icon: categories.icon,
    })
    .from(categories)
    .where(
      and(eq(categories.id, transactionId), eq(categories.sheetId, sheetId)),
    );

  if (!category) {
    notFound();
  }

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
    .where(
      and(
        eq(transactions.sheetId, sheetId),
        eq(transactions.categoryId, category.id),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
      ),
    )
    .orderBy(desc(transactions.date));

  const backParams = new URLSearchParams({
    month: selectedMonth.toString(),
    year: selectedYear.toString(),
    type: selectedType ?? category.type,
  });
  const returnTo = `/sheet/${sheetId}/transactions/${transactionId}?${backParams.toString()}`;
  const CategoryIcon = getLucideIcon(category.icon) || LayoutGrid;

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6">
      <Header
        title={category.name}
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}/transactions?${backParams.toString()}`}
        icon={CategoryIcon}
      />

      <div className="space-y-3">
        {txs.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No transactions found for this category in this period.
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
