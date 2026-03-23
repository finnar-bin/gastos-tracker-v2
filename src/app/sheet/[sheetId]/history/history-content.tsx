"use client";

import { useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BackgroundSyncIndicator } from "@/components/background-sync-indicator";
import { TransactionCard } from "@/components/transaction-card";
import { TransactionFormDialog } from "@/app/sheet/[sheetId]/transactions/transaction-form-dialog";
import { createClient } from "@/lib/supabase/client";
import { fetchHistoryFeed } from "@/lib/history-feed";
import { queryKeys } from "@/lib/query-keys";
import { fetchSheetCurrency } from "@/lib/sheet-currency";
import { fetchTransactionFormData } from "@/lib/transaction-form-data";
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
  const queryClient = useQueryClient();
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
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

  const currency = currencyQuery.data ?? "USD";
  const isRefreshing =
    Boolean(historyQuery.data) &&
    (historyQuery.isFetching || categoriesQuery.isFetching || currencyQuery.isFetching);
  const closeEditDialog = () => setEditingTransactionId(null);
  const handleMutationCompleted = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["sheet", sheetId, "history"] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(sheetId) }),
      queryClient.invalidateQueries({
        queryKey: ["sheet", sheetId, "transactions-overview"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["sheet", sheetId, "category-transactions"],
      }),
    ]);
    closeEditDialog();
  };
  const prefetchEditTransactionForm = (transactionId: string) => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.transactionForm(sheetId, "edit", transactionId, "unknown"),
      queryFn: () =>
        fetchTransactionFormData({
          supabase,
          sheetId,
          mode: "edit",
          transactionId,
        }),
    });
  };

  return (
    <>
      <BackgroundSyncIndicator active={isRefreshing} />
      {editingTransactionId ? (
        <TransactionFormDialog
          sheetId={sheetId}
          mode="edit"
          transactionId={editingTransactionId}
          open={true}
          onOpenChangeAction={(open) => {
            if (!open) {
              closeEditDialog();
            }
          }}
          onCancelAction={closeEditDialog}
          onCompletedAction={() => {
            void handleMutationCompleted();
          }}
        />
      ) : null}
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
                tx={tx}
                currency={currency}
                canEditTransaction={canEditTransaction}
                onEditIntentAction={() => prefetchEditTransactionForm(tx.id)}
                onEditAction={() => setEditingTransactionId(tx.id)}
              />
            ))}
          </>
        )}
      </div>
    </>
  );
}
