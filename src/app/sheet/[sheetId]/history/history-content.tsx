"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BackgroundSyncIndicator } from "@/components/background-sync-indicator";
import { TransactionCard } from "@/components/transaction-card";
import { createClient } from "@/lib/supabase/client";
import { fetchHistoryFeed } from "@/lib/history-feed";
import { queryKeys } from "@/lib/query-keys";
import { fetchSheetCurrency } from "@/lib/sheet-currency";
import { HistoryFilter } from "./filter";

type CategoryRow = {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string;
};

const supabase = createClient();

export function HistoryContent({
  sheetId,
  canEditTransaction,
}: {
  sheetId: string;
  canEditTransaction: boolean;
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
  const typeParam = searchParams.get("type");
  const selectedType =
    typeParam === "income" || typeParam === "expense" ? typeParam : null;
  const selectedCategoryId = searchParams.get("categoryId");
  const historyFilters = {
    year: selectedYear,
    month: selectedMonth,
    type: selectedType as "income" | "expense" | null,
    categoryId: selectedCategoryId,
  };

  const historyQuery = useQuery({
    queryKey: queryKeys.history(sheetId, historyFilters),
    placeholderData: keepPreviousData,
    queryFn: () =>
      fetchHistoryFeed({
        sheetId,
        year: selectedYear,
        month: selectedMonth,
        type: selectedType,
        categoryId: selectedCategoryId,
      }),
  });
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories(sheetId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, type, icon")
        .eq("sheet_id", sheetId)
        .order("name", { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []) as CategoryRow[];
    },
  });
  const currencyQuery = useQuery({
    queryKey: queryKeys.sheetCurrency(sheetId),
    queryFn: () => fetchSheetCurrency(sheetId),
  });

  const availableCategories = categoriesQuery.data ?? [];
  const filteredCategories = selectedType
    ? availableCategories.filter((category) => category.type === selectedType)
    : availableCategories;

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
  const currency = currencyQuery.data ?? "USD";
  const isRefreshing =
    Boolean(historyQuery.data) &&
    (historyQuery.isFetching || categoriesQuery.isFetching || currencyQuery.isFetching);

  return (
    <>
      <BackgroundSyncIndicator active={isRefreshing} />
      <HistoryFilter
        month={selectedMonth}
        year={selectedYear}
        sheetId={sheetId}
        type={selectedType}
        categoryId={selectedCategoryId}
        categories={filteredCategories.map((category) => ({
          id: category.id,
          name: category.name,
          type: category.type,
        }))}
      />

      <div className="space-y-3">
        {historyQuery.isLoading && !historyQuery.data ? (
          Array.from({ length: 5 }, (_, idx) => (
            <div key={idx} className="h-24 rounded-xl bg-muted/40 animate-pulse" />
          ))
        ) : historyQuery.error || categoriesQuery.error || currencyQuery.error ? (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">Failed to load history.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                void historyQuery.refetch();
                void categoriesQuery.refetch();
                void currencyQuery.refetch();
              }}
            >
              Retry
            </Button>
          </div>
        ) : (historyQuery.data?.length ?? 0) === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No transactions found for this period.
          </p>
        ) : (
          <>
            {historyQuery.data?.map((tx) => (
              <TransactionCard
                key={tx.id}
                sheetId={sheetId}
                tx={tx}
                returnTo={returnTo}
                currency={currency}
                canEditTransaction={canEditTransaction}
              />
            ))}
          </>
        )}
      </div>
    </>
  );
}
