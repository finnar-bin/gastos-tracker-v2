"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { queryKeys } from "@/lib/query-keys";
import { createClient } from "@/lib/supabase/client";
import { fetchTransactionFormData } from "@/lib/transaction-form-data";
import TransactionForm, { type TransactionData } from "./add/form";

const supabase = createClient();

export function TransactionFormDialog({
  sheetId,
  cancelHref,
  mode = "add",
  transactionId,
  transactionType,
  inPlace = false,
  onCompletedAction,
  onCancelAction,
  asDialog = false,
  open = false,
  onOpenChangeAction,
}: {
  sheetId: string;
  cancelHref: string;
  mode?: "add" | "edit";
  transactionId?: string;
  transactionType?: "income" | "expense";
  inPlace?: boolean;
  onCompletedAction?: () => void;
  onCancelAction?: () => void;
  asDialog?: boolean;
  open?: boolean;
  onOpenChangeAction?: (open: boolean) => void;
}) {
  const [dialogType, setDialogType] = useState<"income" | "expense">(
    transactionType ?? "expense",
  );
  const transactionFormQuery = useQuery({
    queryKey: queryKeys.transactionForm(
      sheetId,
      mode,
      transactionId ?? "new",
      transactionType ?? "unknown",
    ),
    enabled: asDialog ? open : true,
    queryFn: () =>
      fetchTransactionFormData({
        supabase,
        sheetId,
        mode,
        transactionId,
      }),
  });

  const content = (() => {
    if (transactionFormQuery.isLoading) {
      return <div className="h-96 rounded-xl bg-muted/40 animate-pulse" />;
    }

    if (transactionFormQuery.error) {
      return (
        <div className="rounded-xl border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Failed to load transaction form.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => void transactionFormQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      );
    }

    const categories = transactionFormQuery.data?.categories ?? [];
    const paymentTypes = transactionFormQuery.data?.paymentTypes ?? [];
    const transaction = transactionFormQuery.data?.transaction ?? null;
    const resolvedType = transaction?.type ?? transactionType ?? "expense";
    const normalizedCategories = categories.map((category) => ({
      id: category.id,
      name: category.name,
      icon: category.icon,
      type: category.type,
      defaultAmount: category.default_amount,
    }));

    const initialData: TransactionData | undefined = transaction
      ? {
          id: transaction.id,
          amount: transaction.amount,
          type: transaction.type,
          description: transaction.description,
          date: transaction.date,
          categoryId: transaction.category_id,
          paymentType: transaction.payment_type_id,
        }
      : undefined;

    if (mode === "edit" && !transaction) {
      return (
        <div className="rounded-xl border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">Transaction not found.</p>
        </div>
      );
    }

    return (
      <TransactionForm
        sheetId={sheetId}
        categories={normalizedCategories}
        paymentTypes={paymentTypes}
        transactionType={resolvedType}
        mode={mode}
        initialData={initialData}
        cancelHref={cancelHref}
        inPlace={inPlace}
        onCompletedAction={onCompletedAction}
        onCancelAction={onCancelAction}
        onTypeChangeAction={setDialogType}
      />
    );
  })();

  if (!asDialog) {
    return content;
  }

  if (!open) {
    return null;
  }

  const effectiveType =
    mode === "edit"
      ? (transactionFormQuery.data?.transaction?.type ?? dialogType)
      : dialogType;
  const TitleIcon = effectiveType === "income" ? ArrowUpCircle : ArrowDownCircle;
  const titleLabel = `${mode === "edit" ? "Edit" : "Add"} ${
    effectiveType === "income" ? "Income" : "Expense"
  }`;
  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto bg-card"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TitleIcon
              className={`h-5 w-5 ${
                effectiveType === "income"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            />
            {titleLabel}
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
