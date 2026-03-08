import { requireSheetAccess } from "@/lib/auth/sheets";
import { db } from "@/lib/db";
import {
  recurringTransactions,
  categories,
  paymentTypes,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  ArrowLeft,
  Plus,
  Repeat,
  Calendar,
  CreditCard,
  LayoutGrid,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLucideIcon } from "@/lib/lucide-icons";
import { Header } from "@/components/Header";
import { FormattedAmount } from "@/components/formatted-amount";
import { getSheetCurrency } from "@/lib/sheet-settings";

export default async function RecurringTransactionsPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const { permissions } = await requireSheetAccess(sheetId);
  const sheetCurrency = await getSheetCurrency(sheetId);

  const recurringList = await db
    .select({
      id: recurringTransactions.id,
      amount: recurringTransactions.amount,
      type: recurringTransactions.type,
      description: recurringTransactions.description,
      frequency: recurringTransactions.frequency,
      dayOfMonth: recurringTransactions.dayOfMonth,
      nextProcessDate: recurringTransactions.nextProcessDate,
      isActive: recurringTransactions.isActive,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      paymentTypeName: paymentTypes.name,
    })
    .from(recurringTransactions)
    .where(eq(recurringTransactions.sheetId, sheetId))
    .leftJoin(categories, eq(recurringTransactions.categoryId, categories.id))
    .leftJoin(
      paymentTypes,
      eq(recurringTransactions.paymentType, paymentTypes.id),
    )
    .orderBy(desc(recurringTransactions.createdAt));

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <Header
        title="Recurring"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}/settings`}
        icon={ArrowLeft}
        actions={
          permissions.canAddRecurringTransaction ? (
            <Link href={`/sheet/${sheetId}/settings/recurring/add`}>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </Link>
          ) : null
        }
      />

      <div className="space-y-4">
        {recurringList.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
            <Repeat className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground">
              No recurring transactions yet.
            </p>
            {permissions.canAddRecurringTransaction ? (
              <Link
                href={`/sheet/${sheetId}/settings/recurring/add`}
                className="mt-4 inline-block"
              >
                <Button variant="outline" size="sm">
                  Create your first one
                </Button>
              </Link>
            ) : null}
          </div>
        ) : (
          recurringList.map((rt) => {
            const Icon = getLucideIcon(rt.categoryIcon) || LayoutGrid;
            const isExpense = rt.type === "expense";
            const content = (
              <Card className="overflow-hidden shadow-sm cursor-pointer hover:shadow-lg transition-all duration-300">
                <CardContent className="px-4 flex justify-between items-center">
                  <div className="flex w-full items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center text-xl ${
                          isExpense
                            ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {rt.description || rt.categoryName}
                          {!rt.isActive && (
                            <span className="text-[10px] px-1.5 py-0.5 border rounded-md font-medium text-muted-foreground">
                              Paused
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Next:{" "}
                          {new Date(rt.nextProcessDate).toLocaleDateString()} (
                          {rt.frequency})
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-sm font-bold ${
                          isExpense
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        <FormattedAmount
                          amount={rt.amount}
                          type={rt.type}
                          currency={sheetCurrency}
                        />
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                        <CreditCard className="h-3 w-3" />
                        {rt.paymentTypeName || "Default"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );

            return permissions.canEditRecurringTransaction ? (
              <Link
                key={rt.id}
                href={`/sheet/${sheetId}/settings/recurring/${rt.id}/edit`}
                className="block"
              >
                {content}
              </Link>
            ) : (
              <div key={rt.id}>{content}</div>
            );
          })
        )}
      </div>
    </div>
  );
}
