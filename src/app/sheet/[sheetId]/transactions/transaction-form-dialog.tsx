"use client";

import { useState } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
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

type TransactionFormQueryData = Awaited<ReturnType<typeof fetchTransactionFormData>>;

type TransactionFormDialogBodyProps = {
  sheetId: string;
  mode: "add" | "edit";
  transactionType?: "income" | "expense";
  query: UseQueryResult<TransactionFormQueryData>;
  onCompletedAction?: () => void;
  onCancelAction?: () => void;
  onTypeChangeAction: (nextType: "income" | "expense") => void;
};

function TransactionFormDialogBody({
  sheetId,
  mode,
  transactionType,
  query,
  onCompletedAction,
  onCancelAction,
  onTypeChangeAction,
}: TransactionFormDialogBodyProps) {
  if (query.isLoading) {
    return <div className="h-96 rounded-xl bg-muted/40 animate-pulse" />;
  }

  if (query.error) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Failed to load transaction form.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => void query.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const categories = query.data?.categories ?? [];
  const paymentTypes = query.data?.paymentTypes ?? [];
  const transaction = query.data?.transaction ?? null;
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
      onCompletedAction={onCompletedAction}
      onCancelAction={onCancelAction}
      onTypeChangeAction={onTypeChangeAction}
    />
  );
}

export function TransactionFormDialog({
  sheetId,
  mode = "add",
  transactionId,
  transactionType,
  onCompletedAction,
  onCancelAction,
  open = false,
  onOpenChangeAction,
}: {
  sheetId: string;
  mode?: "add" | "edit";
  transactionId?: string;
  transactionType?: "income" | "expense";
  onCompletedAction?: () => void;
  onCancelAction?: () => void;
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
    enabled: open,
    queryFn: () =>
      fetchTransactionFormData({
        supabase,
        sheetId,
        mode,
        transactionId,
      }),
  });

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
        <TransactionFormDialogBody
          sheetId={sheetId}
          mode={mode}
          transactionType={transactionType}
          query={transactionFormQuery}
          onCompletedAction={onCompletedAction}
          onCancelAction={onCancelAction}
          onTypeChangeAction={setDialogType}
        />
      </DialogContent>
    </Dialog>
  );
}
