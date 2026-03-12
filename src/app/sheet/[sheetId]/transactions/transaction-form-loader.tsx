"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import TransactionForm, { type TransactionData } from "./add/form";

type CategoryRow = {
  id: string;
  name: string;
  icon: string;
  type: "income" | "expense";
  default_amount: string | null;
};

type PaymentTypeRow = {
  id: string;
  name: string;
  icon: string;
};

type TransactionRow = {
  id: string;
  amount: string;
  type: "income" | "expense";
  description: string | null;
  date: string;
  category_id: string;
  payment_type_id: string | null;
};

const supabase = createClient();

export function TransactionFormLoader({
  sheetId,
  cancelHref,
  mode = "add",
  transactionId,
  transactionType,
}: {
  sheetId: string;
  cancelHref: string;
  mode?: "add" | "edit";
  transactionId?: string;
  transactionType?: "income" | "expense";
}) {
  const transactionFormQuery = useQuery({
    queryKey: ["sheet", sheetId, "transaction-form", mode, transactionId ?? "new", transactionType ?? "unknown"],
    queryFn: async () => {
      const [categoriesResult, paymentTypesResult, transactionResult] =
        await Promise.all([
          supabase
            .from("categories")
            .select("id, name, icon, type, default_amount")
            .eq("sheet_id", sheetId),
          supabase
            .from("payment_types")
            .select("id, name, icon")
            .eq("sheet_id", sheetId),
          mode === "edit" && transactionId
            ? supabase
                .from("transactions")
                .select("id, amount, type, description, date, category_id, payment_type_id")
                .eq("sheet_id", sheetId)
                .eq("id", transactionId)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (paymentTypesResult.error) throw paymentTypesResult.error;
      if (transactionResult.error) throw transactionResult.error;

      return {
        categories: (categoriesResult.data ?? []) as CategoryRow[],
        paymentTypes: (paymentTypesResult.data ?? []) as PaymentTypeRow[],
        transaction: transactionResult.data as TransactionRow | null,
      };
    },
  });

  if (transactionFormQuery.isLoading) {
    return <div className="h-96 rounded-xl bg-muted/40 animate-pulse" />;
  }

  if (transactionFormQuery.error) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">Failed to load transaction form.</p>
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
  const filteredCategories = categories
    .filter((category) => category.type === resolvedType)
    .map((category) => ({
      id: category.id,
      name: category.name,
      icon: category.icon,
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
      categories={filteredCategories}
      paymentTypes={paymentTypes}
      transactionType={resolvedType}
      mode={mode}
      initialData={initialData}
      cancelHref={cancelHref}
    />
  );
}
