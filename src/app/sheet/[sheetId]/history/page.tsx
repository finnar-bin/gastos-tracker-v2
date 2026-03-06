import { requireSheetAccess } from "@/lib/auth/sheets";
import { db } from "@/lib/db";
import {
  transactions,
  categories,
  paymentTypes,
  profiles,
} from "@/lib/db/schema";
import { desc, eq, and, gte, lte } from "drizzle-orm";
import { History, LayoutGrid } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { HistoryFilter } from "./filter";
import { getLucideIcon } from "@/lib/lucide-icons";
import { Header } from "@/components/Header";
import { UserAvatar } from "@/components/user-avatar";
import { FormattedAmount } from "@/components/formatted-amount";

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
          txs.map((tx) => {
            const CategoryIcon = getLucideIcon(tx.categoryIcon) || LayoutGrid;
            const PaymentIcon = tx.paymentTypeIcon
              ? getLucideIcon(tx.paymentTypeIcon)
              : null;
            const creatorName =
              tx.creatorDisplayName || tx.creatorEmail || "Unknown user";
            return (
              <Card
                key={tx.id}
                className="overflow-hidden shadow-sm cursor-pointer hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="px-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center text-xl ${
                        tx.type === "expense"
                          ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                      }`}
                    >
                      <CategoryIcon className="h-5 w-5" />
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
                      <p className="text-xs text-muted-foreground pb-1">
                        {new Date(tx.date).toLocaleDateString()}
                      </p>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <UserAvatar
                          email={tx.creatorEmail}
                          displayName={tx.creatorDisplayName}
                          avatarUrl={tx.creatorAvatarUrl}
                          size="xs"
                        />
                        <span>{creatorName}</span>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`font-bold ${tx.type === "expense" ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
                  >
                    <FormattedAmount amount={tx.amount} type={tx.type} />
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
