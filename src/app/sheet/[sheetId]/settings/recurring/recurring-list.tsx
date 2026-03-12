"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Calendar, CreditCard, LayoutGrid, Repeat } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormattedAmount } from "@/components/formatted-amount";
import { getLucideIcon } from "@/lib/lucide-icons";
import { createClient } from "@/lib/supabase/client";

type RecurringRow = {
  id: string;
  amount: string;
  type: "income" | "expense";
  description: string | null;
  frequency: string;
  next_process_date: string;
  is_active: boolean;
  category_id: string;
  payment_type_id: string | null;
  created_at: string;
};

type CategoryRow = {
  id: string;
  name: string;
  icon: string;
};

type PaymentTypeRow = {
  id: string;
  name: string;
};

const supabase = createClient();

export function RecurringList({
  sheetId,
  currency,
  canAddRecurringTransaction,
  canEditRecurringTransaction,
}: {
  sheetId: string;
  currency: string;
  canAddRecurringTransaction: boolean;
  canEditRecurringTransaction: boolean;
}) {
  const recurringQuery = useQuery({
    queryKey: ["sheet", sheetId, "recurring"],
    queryFn: async () => {
      const [recurringResult, categoriesResult, paymentTypesResult] =
        await Promise.all([
          supabase
            .from("recurring_transactions")
            .select(
              "id, amount, type, description, frequency, next_process_date, is_active, category_id, payment_type_id, created_at",
            )
            .eq("sheet_id", sheetId)
            .order("created_at", { ascending: false }),
          supabase.from("categories").select("id, name, icon").eq("sheet_id", sheetId),
          supabase.from("payment_types").select("id, name").eq("sheet_id", sheetId),
        ]);

      if (recurringResult.error) throw recurringResult.error;
      if (categoriesResult.error) throw categoriesResult.error;
      if (paymentTypesResult.error) throw paymentTypesResult.error;

      const categoriesById = new Map(
        ((categoriesResult.data ?? []) as CategoryRow[]).map((category) => [
          category.id,
          category,
        ]),
      );
      const paymentTypesById = new Map(
        ((paymentTypesResult.data ?? []) as PaymentTypeRow[]).map(
          (paymentType) => [paymentType.id, paymentType],
        ),
      );

      return ((recurringResult.data ?? []) as RecurringRow[]).map((rt) => ({
        ...rt,
        categoryName: categoriesById.get(rt.category_id)?.name ?? "Category",
        categoryIcon: categoriesById.get(rt.category_id)?.icon ?? "LayoutGrid",
        paymentTypeName: rt.payment_type_id
          ? paymentTypesById.get(rt.payment_type_id)?.name ?? null
          : null,
      }));
    },
  });

  if (recurringQuery.isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }, (_, idx) => (
          <div key={idx} className="h-24 rounded-xl bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (recurringQuery.error) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Failed to load recurring transactions.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => void recurringQuery.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const recurringList = recurringQuery.data ?? [];

  if (recurringList.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
        <Repeat className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
        <p className="text-muted-foreground">No recurring transactions yet.</p>
        {canAddRecurringTransaction ? (
          <Link
            href={`/sheet/${sheetId}/settings/recurring/add`}
            className="mt-4 inline-block"
          >
            <Button variant="outline" size="sm">
              Create your first one
            </Button>
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
          <Link
            key={rt.id}
            href={`/sheet/${sheetId}/settings/recurring/${rt.id}/edit`}
            className="block"
          >
            {content}
          </Link>
        ) : (
          <div key={rt.id}>{content}</div>
        );
      })}
    </div>
  );
}
