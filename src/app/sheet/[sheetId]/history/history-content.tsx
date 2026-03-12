"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TransactionCard } from "@/components/transaction-card";
import { createClient } from "@/lib/supabase/client";
import type { SheetMemberProfile } from "@/lib/sheet-member-profiles";
import { HistoryFilter } from "./filter";

type CategoryRow = {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string;
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
  created_by: string;
};

const supabase = createClient();

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function HistoryContent({
  sheetId,
  currency,
  canEditTransaction,
  memberProfiles,
}: {
  sheetId: string;
  currency: string;
  canEditTransaction: boolean;
  memberProfiles: SheetMemberProfile[];
}) {
  const profilesById = new Map(memberProfiles.map((profile) => [profile.id, profile]));
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

  const historyQuery = useQuery({
    queryKey: [
      "sheet",
      sheetId,
      "history",
      selectedYear,
      selectedMonth,
      selectedType ?? "all",
      selectedCategoryId ?? "all",
    ],
    queryFn: async () => {
      const startDate = toIsoDate(new Date(selectedYear, selectedMonth, 1));
      const endDate = toIsoDate(new Date(selectedYear, selectedMonth + 1, 0));
      let txQuery = supabase
        .from("transactions")
        .select("id, amount, type, description, date, category_id, payment_type_id, created_by")
        .eq("sheet_id", sheetId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      if (selectedType) {
        txQuery = txQuery.eq("type", selectedType);
      }
      if (selectedCategoryId) {
        txQuery = txQuery.eq("category_id", selectedCategoryId);
      }

      const [categoriesResult, transactionsResult] = await Promise.all([
        supabase
          .from("categories")
          .select("id, name, type, icon")
          .eq("sheet_id", sheetId)
          .order("name", { ascending: true }),
        txQuery,
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (transactionsResult.error) throw transactionsResult.error;

      const categories = (categoriesResult.data ?? []) as CategoryRow[];
      const txs = (transactionsResult.data ?? []) as TransactionRow[];
      const paymentTypeIds = [...new Set(txs.map((tx) => tx.payment_type_id).filter(Boolean))] as string[];
      const [paymentTypesResult] = await Promise.all([
        paymentTypeIds.length > 0
          ? supabase.from("payment_types").select("id, name, icon").in("id", paymentTypeIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (paymentTypesResult.error) throw paymentTypesResult.error;

      const categoriesById = new Map(categories.map((category) => [category.id, category]));
      const paymentTypesById = new Map(
        ((paymentTypesResult.data ?? []) as PaymentTypeRow[]).map((paymentType) => [
          paymentType.id,
          paymentType,
        ]),
      );

      return {
        categories,
        transactions: txs.map((tx) => {
          const category = categoriesById.get(tx.category_id);
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
            categoryName: category?.name ?? "Category",
            categoryIcon: category?.icon ?? "LayoutGrid",
            paymentTypeName: paymentType?.name ?? null,
            paymentTypeIcon: paymentType?.icon ?? null,
            creatorDisplayName: profile?.displayName ?? null,
            creatorEmail: profile?.email ?? null,
            creatorAvatarUrl: profile?.avatarUrl ?? null,
          };
        }),
      };
    },
  });

  const availableCategories = historyQuery.data?.categories ?? [];
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

  return (
    <>
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
        {historyQuery.isLoading ? (
          Array.from({ length: 5 }, (_, idx) => (
            <div key={idx} className="h-24 rounded-xl bg-muted/40 animate-pulse" />
          ))
        ) : historyQuery.error ? (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">Failed to load history.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => void historyQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : (historyQuery.data?.transactions.length ?? 0) === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No transactions found for this period.
          </p>
        ) : (
          historyQuery.data?.transactions.map((tx) => (
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
    </>
  );
}
