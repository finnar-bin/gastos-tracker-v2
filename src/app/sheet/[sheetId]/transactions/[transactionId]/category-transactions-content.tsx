"use client";

import { useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { BackgroundSyncIndicator } from "@/components/background-sync-indicator";
import { Button } from "@/components/ui/button";
import { TransactionCard } from "@/components/transaction-card";
import { TransactionFormDialog } from "@/app/sheet/[sheetId]/transactions/transaction-form-dialog";
import { fetchCategoryTransactions } from "@/lib/category-transactions";
import { queryKeys } from "@/lib/query-keys";
import { fetchSheetCurrency } from "@/lib/sheet-currency";
import { fetchTransactionFormData } from "@/lib/transaction-form-data";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export function CategoryTransactionsContent({
  sheetId,
  categoryId,
  categoryName,
  categoryIcon,
  categoryType,
  canEditTransaction,
}: {
  sheetId: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryType: "income" | "expense";
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
  const selectedType =
    searchParams.get("type") === "income" || searchParams.get("type") === "expense"
      ? (searchParams.get("type") as "income" | "expense")
      : categoryType;
  const categoryTransactionFilters = {
    year: selectedYear,
    month: selectedMonth,
    type: selectedType,
  };

  const categoryTransactionsQuery = useQuery({
    queryKey: queryKeys.categoryTransactions(
      sheetId,
      categoryId,
      categoryTransactionFilters,
    ),
    placeholderData: keepPreviousData,
    queryFn: () =>
      fetchCategoryTransactions({
        sheetId,
        categoryId,
        year: selectedYear,
        month: selectedMonth,
      }),
  });
  const currencyQuery = useQuery({
    queryKey: queryKeys.sheetCurrency(sheetId),
    queryFn: () => fetchSheetCurrency(sheetId),
  });

  const backParams = new URLSearchParams({
    month: selectedMonth.toString(),
    year: selectedYear.toString(),
    type: selectedType,
  });
  const historyReturnTo = `/sheet/${sheetId}/history?${backParams.toString()}&categoryId=${categoryId}&type=${selectedType}`;

  if (categoryTransactionsQuery.isLoading && !categoryTransactionsQuery.data) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, idx) => (
          <div key={idx} className="h-24 rounded-xl bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (categoryTransactionsQuery.error || currencyQuery.error) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">Failed to load transactions.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            void categoryTransactionsQuery.refetch();
            void currencyQuery.refetch();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  const transactions = categoryTransactionsQuery.data ?? [];
  const currency = currencyQuery.data ?? "USD";
  const isRefreshing =
    Boolean(categoryTransactionsQuery.data) &&
    (categoryTransactionsQuery.isFetching || currencyQuery.isFetching);
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
    <div className="space-y-3">
      <BackgroundSyncIndicator active={isRefreshing} />
      {editingTransactionId ? (
        <TransactionFormDialog
          sheetId={sheetId}
          mode="edit"
          transactionId={editingTransactionId}
          cancelHref={historyReturnTo}
          inPlace
          asDialog
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
      {transactions.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          No transactions found for this category in this period.
        </p>
      ) : (
        transactions.map((tx) => (
          <TransactionCard
            key={tx.id}
            tx={{
              ...tx,
              categoryName,
              categoryIcon,
            }}
            currency={currency}
            canEditTransaction={canEditTransaction}
            onEditIntentAction={() => prefetchEditTransactionForm(tx.id)}
            onEditAction={() => setEditingTransactionId(tx.id)}
          />
        ))
      )}
    </div>
  );
}
