"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/query-keys";
import { createClient } from "@/lib/supabase/client";
import RecurringTransactionForm, {
  type RecurringTransactionData,
} from "./add/form";

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

type RecurringRow = {
  id: string;
  amount: string;
  type: "income" | "expense";
  description: string | null;
  frequency: string;
  day_of_month: string | null;
  category_id: string;
  payment_type_id: string | null;
};

const supabase = createClient();

export function RecurringFormLoader({
  sheetId,
  mode = "add",
  recurringId,
}: {
  sheetId: string;
  mode?: "add" | "edit";
  recurringId?: string;
}) {
  const recurringFormQuery = useQuery({
    queryKey: queryKeys.recurringForm(sheetId, mode, recurringId ?? "new"),
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
          mode === "edit" && recurringId
            ? supabase
                .from("recurring_transactions")
                .select("id, amount, type, description, frequency, day_of_month, category_id, payment_type_id")
                .eq("sheet_id", sheetId)
                .eq("id", recurringId)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (paymentTypesResult.error) throw paymentTypesResult.error;
      if (recurringResult.error) throw recurringResult.error;

      return {
        categories: (categoriesResult.data ?? []) as CategoryRow[],
        paymentTypes: (paymentTypesResult.data ?? []) as PaymentTypeRow[],
        recurring: recurringResult.data as RecurringRow | null,
      };
    },
  });

  if (recurringFormQuery.isLoading) {
    return <div className="h-96 rounded-xl bg-muted/40 animate-pulse" />;
  }

  if (recurringFormQuery.error) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">Failed to load recurring form.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => void recurringFormQuery.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const categories = (recurringFormQuery.data?.categories ?? []).map((category) => ({
    id: category.id,
    name: category.name,
    icon: category.icon,
    type: category.type,
    defaultAmount: category.default_amount,
  }));
  const paymentTypes = recurringFormQuery.data?.paymentTypes ?? [];
  const recurring = recurringFormQuery.data?.recurring ?? null;

  const initialData: RecurringTransactionData | undefined = recurring
    ? {
        id: recurring.id,
        amount: recurring.amount,
        type: recurring.type,
        description: recurring.description,
        frequency: recurring.frequency,
        dayOfMonth: recurring.day_of_month,
        categoryId: recurring.category_id,
        paymentType: recurring.payment_type_id ?? "",
      }
    : undefined;

  if (mode === "edit" && !recurring) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">Recurring transaction not found.</p>
      </div>
    );
  }

  return (
    <RecurringTransactionForm
      sheetId={sheetId}
      categories={categories}
      paymentTypes={paymentTypes}
      mode={mode}
      initialData={initialData}
    />
  );
}
