"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, LayoutGrid, TrendingDown, TrendingUp } from "lucide-react";
import { createElement } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TabHeader } from "@/components/tab-header";
import { FormattedAmount } from "@/components/formatted-amount";
import { getLucideIcon } from "@/lib/lucide-icons";
import { queryKeys } from "@/lib/query-keys";
import { createClient } from "@/lib/supabase/client";

type CategoryRow = {
  id: string;
  name: string;
  icon: string;
  type: "income" | "expense";
  budget: string | null;
  due_date: string | null;
  due_reminder_frequency: string | null;
  created_at: string;
};

type CurrencyRow = {
  currency: string;
};

const supabase = createClient();

async function fetchCategories(sheetId: string, type: "income" | "expense") {
  const { data, error } = await supabase
    .from("categories")
    .select(
      "id, name, icon, type, budget, due_date, due_reminder_frequency, created_at",
    )
    .eq("sheet_id", sheetId)
    .eq("type", type)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as CategoryRow[];
}

async function fetchSheetCurrency(sheetId: string) {
  const { data, error } = await supabase
    .from("sheet_settings")
    .select("currency")
    .eq("sheet_id", sheetId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return ((data as CurrencyRow | null)?.currency ?? "USD") as string;
}

const TYPE_TABS = [
  {
    value: "income",
    label: "Income",
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    value: "expense",
    label: "Expense",
    icon: <TrendingDown className="h-4 w-4" />,
  },
];

export function CategoryList({
  sheetId,
  canEditCategory,
  canAddCategory,
}: {
  sheetId: string;
  canEditCategory: boolean;
  canAddCategory: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedType =
    searchParams.get("type") === "income" ? "income" : "expense";
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories(sheetId, selectedType),
    queryFn: () => fetchCategories(sheetId, selectedType),
  });
  const currencyQuery = useQuery({
    queryKey: queryKeys.sheetCurrency(sheetId),
    queryFn: () => fetchSheetCurrency(sheetId),
  });

  const navigateWithType = (type: "income" | "expense") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", type);
    router.push(`/sheet/${sheetId}/settings/category?${params.toString()}`);
  };

  if (categoriesQuery.isLoading || currencyQuery.isLoading) {
    return (
      <div className="space-y-4">
        <TabHeader
          value={selectedType}
          onChangeAction={(value) =>
            navigateWithType(value as "income" | "expense")
          }
          items={TYPE_TABS}
        />
        {Array.from({ length: 3 }, (_, idx) => (
          <Card key={idx} className="overflow-hidden">
            <CardContent className="h-24 animate-pulse bg-muted/40" />
          </Card>
        ))}
      </div>
    );
  }

  if (categoriesQuery.error || currencyQuery.error) {
    return (
      <div className="space-y-4">
        <TabHeader
          value={selectedType}
          onChangeAction={(value) =>
            navigateWithType(value as "income" | "expense")
          }
          items={TYPE_TABS}
        />
        <div className="rounded-xl border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Failed to load categories.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              void categoriesQuery.refetch();
              void currencyQuery.refetch();
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const categoryList = categoriesQuery.data ?? [];
  const sheetCurrency = currencyQuery.data ?? "USD";

  if (categoryList.length === 0) {
    return (
      <div className="space-y-4">
        <TabHeader
          value={selectedType}
          onChangeAction={(value) =>
            navigateWithType(value as "income" | "expense")
          }
          items={TYPE_TABS}
        />
        <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
          <LayoutGrid className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
          <p className="text-muted-foreground">
            No {selectedType} categories yet.
          </p>
          {canAddCategory ? (
            <Link
              href={`/sheet/${sheetId}/settings/category/add?type=${selectedType}`}
              className="mt-4 inline-block"
            >
              <Button variant="outline" size="sm">
                Create your first one
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TabHeader
        value={selectedType}
        onChangeAction={(value) =>
          navigateWithType(value as "income" | "expense")
        }
        items={TYPE_TABS}
      />
      {categoryList.map((category) => {
        const Icon = getLucideIcon(category.icon) || LayoutGrid;
        const isExpense = category.type === "expense";
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
                    {createElement(Icon, { className: "h-5 w-5" })}
                  </div>
                  <div>
                    <div className="font-medium">{category.name}</div>
                    <div className="text-xs text-muted-foreground pb-1 capitalize">
                      {category.type}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {category.budget ? (
                    <div
                      className={`text-sm font-bold ${
                        isExpense
                          ? "text-red-600 dark:text-red-400"
                          : "text-green-600 dark:text-green-400"
                      }`}
                    >
                      <FormattedAmount
                        amount={category.budget}
                        showSign={false}
                        currency={sheetCurrency}
                      />{" "}
                      budget
                    </div>
                  ) : null}
                  {category.due_date ? (
                    <div className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                      <Calendar className="h-3 w-3" />
                      Due: {new Date(category.due_date).toLocaleDateString()}
                    </div>
                  ) : null}
                  {category.due_reminder_frequency ? (
                    <div className="text-[10px] text-muted-foreground capitalize">
                      Reminder:{" "}
                      {category.due_reminder_frequency.replace("_", " ")}
                    </div>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        );

        return canEditCategory ? (
          <Link
            key={category.id}
            href={`/sheet/${sheetId}/settings/category/${category.id}/edit?type=${selectedType}`}
            className="block"
          >
            {content}
          </Link>
        ) : (
          <div key={category.id}>{content}</div>
        );
      })}
    </div>
  );
}
