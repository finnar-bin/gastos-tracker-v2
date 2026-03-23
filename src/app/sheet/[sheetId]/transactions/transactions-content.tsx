"use client";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { AlertTriangle, LayoutGrid } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackgroundSyncIndicator } from "@/components/background-sync-indicator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FormattedAmount } from "@/components/formatted-amount";
import { getLucideIcon } from "@/lib/lucide-icons";
import { queryKeys } from "@/lib/query-keys";
import { fetchSheetCurrency } from "@/lib/sheet-currency";
import { fetchCategoryTransactions } from "@/lib/category-transactions";
import { fetchTransactionOverview } from "@/lib/transaction-overview";
import { usePrefetchGuard } from "@/components/use-prefetch-guard";
import { TransactionsFilter } from "./filter";

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

export function TransactionsContent({ sheetId }: { sheetId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { shouldPrefetch } = usePrefetchGuard();
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
    (searchParams.get("type") === "income" ? "income" : "expense") as
      | "income"
      | "expense";
  const overviewFilters = {
    year: selectedYear,
    month: selectedMonth,
    type: selectedType,
  };

  const overviewQuery = useQuery({
    queryKey: queryKeys.transactionsOverview(sheetId, overviewFilters),
    placeholderData: keepPreviousData,
    queryFn: () =>
      fetchTransactionOverview({
        sheetId,
        year: selectedYear,
        month: selectedMonth,
        type: selectedType,
      }),
  });
  const currencyQuery = useQuery({
    queryKey: queryKeys.sheetCurrency(sheetId),
    queryFn: () => fetchSheetCurrency(sheetId),
  });
  const currency = currencyQuery.data ?? "USD";
  const isRefreshing =
    Boolean(overviewQuery.data) && (overviewQuery.isFetching || currencyQuery.isFetching);
  const prefetchCategoryDetails = (categoryId: string) => {
    const detailUrl = `/sheet/${sheetId}/transactions/${categoryId}?month=${selectedMonth}&year=${selectedYear}&type=${selectedType}`;
    void router.prefetch(detailUrl);
    void queryClient.prefetchQuery({
      queryKey: queryKeys.categoryTransactions(sheetId, categoryId, {
        year: selectedYear,
        month: selectedMonth,
        type: selectedType,
      }),
      queryFn: () =>
        fetchCategoryTransactions({
          sheetId,
          categoryId,
          year: selectedYear,
          month: selectedMonth,
        }),
    });
  };

  const prefetchCategoryDetailsForTouch = (categoryId: string) => {
    if (!shouldPrefetch(`tx-category:${categoryId}:${selectedYear}:${selectedMonth}:${selectedType}`)) {
      return;
    }

    prefetchCategoryDetails(categoryId);
  };

  return (
    <>
      <BackgroundSyncIndicator active={isRefreshing} />
      <TransactionsFilter
        month={selectedMonth}
        year={selectedYear}
        sheetId={sheetId}
        type={selectedType}
      />

      <div className="space-y-3">
        {overviewQuery.isLoading && !overviewQuery.data ? (
          Array.from({ length: 5 }, (_, idx) => (
            <div key={idx} className="h-20 rounded-xl bg-muted/40 animate-pulse" />
          ))
        ) : overviewQuery.error || currencyQuery.error ? (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">Failed to load transactions.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                void overviewQuery.refetch();
                void currencyQuery.refetch();
              }}
            >
              Retry
            </Button>
          </div>
        ) : (overviewQuery.data?.length ?? 0) === 0 ? (
          <p className="text-center text-muted-foreground py-10">
            No {selectedType} categories found.
          </p>
        ) : (
          <>
            {overviewQuery.data?.map((category) => {
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
                  onMouseEnter={() => prefetchCategoryDetails(category.id)}
                  onFocus={() => prefetchCategoryDetails(category.id)}
                  onTouchStart={() => prefetchCategoryDetailsForTouch(category.id)}
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
            })}
          </>
        )}
      </div>
    </>
  );
}
