"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TransactionCard } from "@/components/transaction-card";
import { createClient } from "@/lib/supabase/client";

type PaymentTypeRow = {
  id: string;
  name: string;
  icon: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type TransactionRow = {
  id: string;
  amount: string;
  type: "income" | "expense";
  description: string | null;
  date: string;
  payment_type_id: string | null;
  created_by: string;
};

const supabase = createClient();

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function CategoryTransactionsContent({
  sheetId,
  categoryId,
  categoryName,
  categoryIcon,
  categoryType,
  currency,
  canEditTransaction,
}: {
  sheetId: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryType: "income" | "expense";
  currency: string;
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
  const selectedType =
    searchParams.get("type") === "income" || searchParams.get("type") === "expense"
      ? (searchParams.get("type") as "income" | "expense")
      : categoryType;

  const categoryTransactionsQuery = useQuery({
    queryKey: ["sheet", sheetId, "category-transactions", categoryId, selectedYear, selectedMonth],
    queryFn: async () => {
      const startDate = toIsoDate(new Date(selectedYear, selectedMonth, 1));
      const endDate = toIsoDate(new Date(selectedYear, selectedMonth + 1, 0));
      const { data: txs, error } = await supabase
        .from("transactions")
        .select("id, amount, type, description, date, payment_type_id, created_by")
        .eq("sheet_id", sheetId)
        .eq("category_id", categoryId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      if (error) throw error;

      const transactions = (txs ?? []) as TransactionRow[];
      const paymentTypeIds = [...new Set(transactions.map((tx) => tx.payment_type_id).filter(Boolean))] as string[];
      const creatorIds = [...new Set(transactions.map((tx) => tx.created_by))];

      const [paymentTypesResult, profilesResult] = await Promise.all([
        paymentTypeIds.length > 0
          ? supabase.from("payment_types").select("id, name, icon").in("id", paymentTypeIds)
          : Promise.resolve({ data: [], error: null }),
        creatorIds.length > 0
          ? supabase
              .from("profiles")
              .select("id, display_name, email, avatar_url")
              .in("id", creatorIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (paymentTypesResult.error) throw paymentTypesResult.error;
      if (profilesResult.error) throw profilesResult.error;

      const paymentTypesById = new Map(
        ((paymentTypesResult.data ?? []) as PaymentTypeRow[]).map((paymentType) => [
          paymentType.id,
          paymentType,
        ]),
      );
      const profilesById = new Map(
        ((profilesResult.data ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]),
      );

      return transactions.map((tx) => {
        const paymentType = tx.payment_type_id
          ? paymentTypesById.get(tx.payment_type_id)
          : null;
        const profile = profilesById.get(tx.created_by);

        return {
          id: tx.id,
          amount: tx.amount,
          type: tx.type,
          description: tx.description,
          date: tx.date,
          categoryName,
          categoryIcon,
          paymentTypeName: paymentType?.name ?? null,
          paymentTypeIcon: paymentType?.icon ?? null,
          creatorDisplayName: profile?.display_name ?? null,
          creatorEmail: profile?.email ?? null,
          creatorAvatarUrl: profile?.avatar_url ?? null,
        };
      });
    },
  });

  const backParams = new URLSearchParams({
    month: selectedMonth.toString(),
    year: selectedYear.toString(),
    type: selectedType,
  });
  const returnTo = `/sheet/${sheetId}/transactions/${categoryId}?${backParams.toString()}`;

  if (categoryTransactionsQuery.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, idx) => (
          <div key={idx} className="h-24 rounded-xl bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (categoryTransactionsQuery.error) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">Failed to load transactions.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => void categoryTransactionsQuery.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const transactions = categoryTransactionsQuery.data ?? [];

  return (
    <div className="space-y-3">
      {transactions.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          No transactions found for this category in this period.
        </p>
      ) : (
        transactions.map((tx) => (
          <TransactionCard
            key={tx.id}
            sheetId={sheetId}
            tx={tx}
            returnTo={returnTo}
            currency={currency}
            canEditTransaction={canEditTransaction}
          />
        ))
      )}
    </div>
  );
}
