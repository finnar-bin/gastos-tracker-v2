"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AlertTriangle, LayoutGrid } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FormattedAmount } from "@/components/formatted-amount";
import { getMonthDateRange } from "@/lib/date-only";
import { getLucideIcon } from "@/lib/lucide-icons";
import { createClient } from "@/lib/supabase/client";
import { TransactionsFilter } from "./filter";

type CategoryRow = {
  id: string;
  name: string;
  icon: string;
  type: "income" | "expense";
  budget: string | null;
};

type TransactionRow = {
  category_id: string;
  amount: string;
};

const supabase = createClient();

function getBudgetStatus(totalAmount: string, budget: string | null) {
  if (!budget) {
    return {
      amountClassName: "text-foreground",
      budgetLeft: null as number | null,
      shouldShowWarning: false,
    };
  }

  const total = Number(totalAmount);
  const parsedBudget = Number(budget);

  if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
    return {
      amountClassName: "text-foreground",
      budgetLeft: null as number | null,
      shouldShowWarning: false,
    };
  }

  const budgetLeft = parsedBudget - total;

  if (budgetLeft < 0) {
    return {
      amountClassName: "text-red-600 dark:text-red-400",
      budgetLeft,
      shouldShowWarning: true,
    };
  }

  if (budgetLeft / parsedBudget <= 0.15) {
    return {
      amountClassName: "text-orange-500 dark:text-orange-400",
      budgetLeft,
      shouldShowWarning: true,
    };
  }

  return {
    amountClassName: "text-foreground",
    budgetLeft,
    shouldShowWarning: false,
  };
}

export function TransactionsContent({
  sheetId,
  currency,
}: {
  sheetId: string;
  currency: string;
}) {
  const searchParams = useSearchParams();
  const now = new Date();
  const parsedYear = Number.parseInt(searchParams.get("year") ?? "", 10);
  const parsedMonth = Number.parseInt(searchParams.get("month") ?? "", 10);
  const selectedYear = Number.isFinite(parsedYear) ? parsedYear : now.getFullYear();
  const selectedMonth =
    Number.isFinite(parsedMonth) && parsedMonth >= 0 && parsedMonth <= 11
      ? parsedMonth
      : now.getMonth();
  const selectedType =
    searchParams.get("type") === "income" ? "income" : "expense";

  const overviewQuery = useQuery({
    queryKey: [
      "sheet",
      sheetId,
      "transactions-overview",
      selectedYear,
      selectedMonth,
      selectedType,
    ],
    queryFn: async () => {
      const { startDate, endDate } = getMonthDateRange(
        selectedYear,
        selectedMonth,
      );
      const [categoriesResult, transactionsResult] = await Promise.all([
        supabase
          .from("categories")
          .select("id, name, icon, type, budget")
          .eq("sheet_id", sheetId)
          .eq("type", selectedType)
          .order("name", { ascending: true }),
        supabase
          .from("transactions")
          .select("category_id, amount")
          .eq("sheet_id", sheetId)
          .eq("type", selectedType)
          .gte("date", startDate)
          .lte("date", endDate),
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (transactionsResult.error) throw transactionsResult.error;

      const totalsByCategory = new Map<string, number>();
      for (const tx of (transactionsResult.data ?? []) as TransactionRow[]) {
        totalsByCategory.set(
          tx.category_id,
          (totalsByCategory.get(tx.category_id) ?? 0) + Number(tx.amount ?? 0),
        );
      }

      return ((categoriesResult.data ?? []) as CategoryRow[]).map((category) => ({
        ...category,
        totalAmount: String(totalsByCategory.get(category.id) ?? 0),
      }));
    },
  });

  return (
    <>
      <TransactionsFilter
        month={selectedMonth}
        year={selectedYear}
        sheetId={sheetId}
        type={selectedType}
      />

      <div className="space-y-3">
        {overviewQuery.isLoading ? (
          Array.from({ length: 5 }, (_, idx) => (
            <div key={idx} className="h-20 rounded-xl bg-muted/40 animate-pulse" />
          ))
        ) : overviewQuery.error ? (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">Failed to load transactions.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => void overviewQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : (overviewQuery.data?.length ?? 0) === 0 ? (
          <p className="text-center text-muted-foreground py-10">
            No {selectedType} categories found.
          </p>
        ) : (
          overviewQuery.data?.map((category) => {
            const Icon = getLucideIcon(category.icon) || LayoutGrid;
            const { amountClassName, budgetLeft, shouldShowWarning } = getBudgetStatus(
              category.totalAmount,
              category.budget,
            );
            const params = new URLSearchParams({
              month: selectedMonth.toString(),
              year: selectedYear.toString(),
              type: selectedType,
            });
            return (
              <Link
                key={category.id}
                href={`/sheet/${sheetId}/transactions/${category.id}?${params.toString()}`}
                className="block"
              >
                <Card className="shadow-sm cursor-pointer hover:shadow-md transition-shadow">
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
                    <div className="text-right">
                      <div
                        className={`flex items-center justify-end gap-1 font-bold ${amountClassName}`}
                      >
                        <FormattedAmount
                          amount={category.totalAmount}
                          showSign={false}
                          currency={currency}
                        />
                        {category.budget && budgetLeft !== null && shouldShowWarning ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center">
                                  <AlertTriangle className="h-4 w-4" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {budgetLeft < 0 ? "Budget exceeded by " : "Budget left: "}
                                <FormattedAmount
                                  amount={Math.abs(budgetLeft)}
                                  showSign={false}
                                  currency={currency}
                                />
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : null}
                      </div>
                      {category.budget ? (
                        <div className="text-xs text-muted-foreground">
                          <FormattedAmount
                            amount={category.budget}
                            showSign={false}
                            currency={currency}
                          />{" "}
                          budget
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </>
  );
}
