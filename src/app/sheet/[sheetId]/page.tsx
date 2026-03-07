import { createElement } from "react";
import { requireSheetAccess } from "@/lib/auth/sheets";
import { db } from "@/lib/db";
import { categories, profiles, transactions } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Wallet, History, CreditCard, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { getLucideIcon } from "@/lib/lucide-icons";
import { FormattedAmount } from "@/components/formatted-amount";
import { UserAvatar } from "@/components/user-avatar";

export default async function SheetDashboardPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const { sheet } = await requireSheetAccess(sheetId);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const monthlyTotals = await db
    .select({
      type: transactions.type,
      total: sql<string>`coalesce(sum(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.sheetId, sheetId),
        gte(transactions.date, monthStart),
        lte(transactions.date, monthEnd),
      ),
    )
    .groupBy(transactions.type);

  const incomeTotal =
    monthlyTotals.find((row) => row.type === "income")?.total ?? "0";
  const expenseTotal =
    monthlyTotals.find((row) => row.type === "expense")?.total ?? "0";

  const recentTransactions = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      type: transactions.type,
      description: transactions.description,
      date: transactions.date,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      creatorDisplayName: profiles.displayName,
      creatorEmail: profiles.email,
      creatorAvatarUrl: profiles.avatarUrl,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(profiles, eq(transactions.createdBy, profiles.id))
    .where(eq(transactions.sheetId, sheetId))
    .orderBy(desc(transactions.createdAt))
    .limit(5);

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{sheet.name}</h1>
          <p className="text-muted-foreground text-sm">Dashboard</p>
        </div>
        <div className="flex gap-2 md:hidden">
          <Link href="/sheet">
            <Button variant="outline" size="sm">
              Sheets
            </Button>
          </Link>
          <form action="/auth/signout" method="post">
            <Button variant="ghost" size="sm">
              Sign Out
            </Button>
          </form>
        </div>
      </header>

      {/* Balance Card */}
      <Card className="bg-linear-to-br from-primary to-primary/80 text-primary-foreground border-none shadow-lg gap-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
            <Wallet className="h-4 w-4" /> This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-80 text-lg">Total Income</span>
              <span className="font-bold text-lg">
                <FormattedAmount amount={incomeTotal} type="income" />
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-80 text-lg">Total Expenses</span>
              <span className="font-bold text-lg">
                <FormattedAmount amount={expenseTotal} type="expense" />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href={`/sheet/${sheetId}/transactions/add?type=income`}
          className="w-full"
        >
          <Button
            variant="outline"
            className="w-full h-24 flex flex-col gap-2 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950 dark:hover:text-green-400 border-dashed"
          >
            <Plus className="h-6 w-6 text-green-500" />
            <span className="font-medium">Income</span>
          </Button>
        </Link>
        <Link
          href={`/sheet/${sheetId}/transactions/add?type=expense`}
          className="w-full"
        >
          <Button
            variant="outline"
            className="w-full h-24 flex flex-col gap-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 border-dashed"
          >
            <Plus className="h-6 w-6 text-red-500" />
            <span className="font-medium">Expense</span>
          </Button>
        </Link>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <History className="h-5 w-5" /> Recent
          </h2>
          <Link
            href={`/sheet/${sheetId}/history`}
            className="text-sm text-primary hover:underline"
          >
            View All
          </Link>
        </div>
        <Card className="shadow-sm p-0">
          <CardContent className="p-0">
            {recentTransactions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                <CreditCard className="h-10 w-10 opacity-20" />
                <p>No transactions yet.</p>
              </div>
            ) : (
              <div className="divide-y">
                {recentTransactions.map((tx) => {
                  const Icon = getLucideIcon(tx.categoryIcon) || LayoutGrid;
                  const creatorName =
                    tx.creatorDisplayName || tx.creatorEmail || "Unknown user";

                  return (
                    <div
                      key={tx.id}
                      className="px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center ${
                            tx.type === "expense"
                              ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                          }`}
                        >
                          {createElement(Icon, { className: "h-4 w-4" })}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {tx.description || tx.categoryName}
                          </p>
                          <p className="text-[11px] text-muted-foreground capitalize">
                            {tx.type} · {new Date(tx.date).toLocaleDateString()}
                          </p>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                            <UserAvatar
                              email={tx.creatorEmail}
                              displayName={tx.creatorDisplayName}
                              avatarUrl={tx.creatorAvatarUrl}
                              size="xs"
                            />
                            <span className="truncate">{creatorName}</span>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`shrink-0 text-sm font-bold ${
                          tx.type === "expense"
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        <FormattedAmount amount={tx.amount} type={tx.type} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
