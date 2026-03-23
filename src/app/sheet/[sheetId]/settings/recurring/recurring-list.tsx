"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, CreditCard, LayoutGrid, Repeat } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackgroundSyncIndicator } from "@/components/background-sync-indicator";
import { FormattedAmount } from "@/components/formatted-amount";
import { RecurringFormDialog } from "@/app/sheet/[sheetId]/settings/recurring/recurring-form-dialog";
import { usePrefetchGuard } from "@/components/use-prefetch-guard";
import { getLucideIcon } from "@/lib/lucide-icons";
import { queryKeys } from "@/lib/query-keys";
import { fetchRecurringOverview } from "@/lib/recurring-overview";
import { fetchSheetCurrency } from "@/lib/sheet-currency";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export function RecurringList({
  sheetId,
  canAddRecurringTransaction,
  canEditRecurringTransaction,
  addDialogOpen: controlledAddDialogOpen,
  onAddDialogOpenChangeAction,
}: {
  sheetId: string;
  canAddRecurringTransaction: boolean;
  canEditRecurringTransaction: boolean;
  addDialogOpen?: boolean;
  onAddDialogOpenChangeAction?: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { shouldPrefetch } = usePrefetchGuard();
  const [internalAddDialogOpen, setInternalAddDialogOpen] = useState(false);
  const [editingRecurringId, setEditingRecurringId] = useState<string | null>(null);
  const addDialogOpen = controlledAddDialogOpen ?? internalAddDialogOpen;
  const setAddDialogOpen = onAddDialogOpenChangeAction ?? setInternalAddDialogOpen;
  const recurringQuery = useQuery({
    queryKey: queryKeys.recurring(sheetId),
    queryFn: () => fetchRecurringOverview(sheetId),
  });
  const prefetchRecurringForm = (recurringId: string) => {
    if (!shouldPrefetch(`recurring-form:${recurringId}`)) {
      return;
    }

    void queryClient.prefetchQuery({
      queryKey: queryKeys.recurringForm(sheetId, "edit", recurringId),
      queryFn: async () => {
        const [categoriesResult, paymentTypesResult, recurringResult] =
          await Promise.all([
            supabase
              .from("categories")
              .select("id, name, icon, type, default_amount")
              .eq("sheet_id", sheetId),
            supabase
              .from("payment_types")
              .select("id, name, icon")
              .eq("sheet_id", sheetId),
            supabase
              .from("recurring_transactions")
              .select("id, amount, type, description, frequency, day_of_month, category_id, payment_type_id")
              .eq("sheet_id", sheetId)
              .eq("id", recurringId)
              .maybeSingle(),
          ]);

        if (categoriesResult.error) throw categoriesResult.error;
        if (paymentTypesResult.error) throw paymentTypesResult.error;
        if (recurringResult.error) throw recurringResult.error;

        return {
          categories: categoriesResult.data ?? [],
          paymentTypes: paymentTypesResult.data ?? [],
          recurring: recurringResult.data,
        };
      },
    });
  };
  const currencyQuery = useQuery({
    queryKey: queryKeys.sheetCurrency(sheetId),
    queryFn: () => fetchSheetCurrency(sheetId),
  });
  const currency = currencyQuery.data ?? "USD";

  if (
    (recurringQuery.isLoading && !recurringQuery.data) ||
    (currencyQuery.isLoading && !currencyQuery.data)
  ) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }, (_, idx) => (
          <div key={idx} className="h-24 rounded-xl bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (recurringQuery.error || currencyQuery.error) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Failed to load recurring transactions.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            void recurringQuery.refetch();
            void currencyQuery.refetch();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  const recurringList = recurringQuery.data ?? [];
  const isRefreshing = recurringQuery.isFetching || currencyQuery.isFetching;

  if (recurringList.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
        {addDialogOpen ? (
          <RecurringFormDialog
            sheetId={sheetId}
            mode="add"
            inPlace
            asDialog
            open={true}
            onOpenChangeAction={setAddDialogOpen}
            onCancelAction={() => setAddDialogOpen(false)}
            onCompletedAction={() => setAddDialogOpen(false)}
          />
        ) : null}
        <Repeat className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
        <p className="text-muted-foreground">No recurring transactions yet.</p>
        {canAddRecurringTransaction ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setAddDialogOpen(true)}
          >
            Create your first one
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      <BackgroundSyncIndicator active={isRefreshing} />
      {addDialogOpen ? (
        <RecurringFormDialog
          sheetId={sheetId}
          mode="add"
          inPlace
          asDialog
          open={true}
          onOpenChangeAction={setAddDialogOpen}
          onCancelAction={() => setAddDialogOpen(false)}
          onCompletedAction={() => setAddDialogOpen(false)}
        />
      ) : null}
      {editingRecurringId ? (
        <RecurringFormDialog
          sheetId={sheetId}
          mode="edit"
          recurringId={editingRecurringId}
          inPlace
          asDialog
          open={true}
          onOpenChangeAction={(open) => {
            if (!open) {
              setEditingRecurringId(null);
            }
          }}
          onCancelAction={() => setEditingRecurringId(null)}
          onCompletedAction={() => setEditingRecurringId(null)}
        />
      ) : null}
      {recurringList.map((rt) => {
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
                      {!rt.is_active ? (
                        <span className="text-[10px] px-1.5 py-0.5 border rounded-md font-medium text-muted-foreground">
                          Paused
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Next: {new Date(rt.next_process_date).toLocaleDateString()} (
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
                    <FormattedAmount amount={rt.amount} type={rt.type} currency={currency} />
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

        return canEditRecurringTransaction ? (
          <button
            key={rt.id}
            type="button"
            className="block w-full text-left"
            onMouseEnter={() => prefetchRecurringForm(rt.id)}
            onFocus={() => prefetchRecurringForm(rt.id)}
            onTouchStart={() => prefetchRecurringForm(rt.id)}
            onClick={() => setEditingRecurringId(rt.id)}
          >
            {content}
          </button>
        ) : (
          <div key={rt.id}>{content}</div>
        );
      })}
    </div>
  );
}
