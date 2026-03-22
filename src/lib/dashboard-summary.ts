import { createClient } from "@/lib/supabase/client";

type DashboardSummaryRow = {
  income_total: string;
  expense_total: string;
  chart_data: Array<{
    month: number;
    income: number | string;
    expense: number | string;
  }> | null;
  recent_transactions: Array<{
    id: string;
    amount: string;
    type: "income" | "expense";
    description: string | null;
    date: string;
    categoryName: string;
    categoryIcon: string;
    creatorDisplayName: string | null;
    creatorEmail: string | null;
    creatorAvatarUrl: string | null;
  }> | null;
};

export type DashboardSummary = {
  incomeTotal: string;
  expenseTotal: string;
  chartData: Array<{
    month: number;
    income: number;
    expense: number;
  }>;
  recentTransactions: Array<{
    id: string;
    amount: string;
    type: "income" | "expense";
    description: string | null;
    date: string;
    categoryName: string;
    categoryIcon: string;
    creatorDisplayName: string | null;
    creatorEmail: string | null;
    creatorAvatarUrl: string | null;
  }>;
};

const supabase = createClient();

export async function fetchDashboardSummary(input: {
  sheetId: string;
  year: number;
  month: number;
}) {
  const { data, error } = await supabase.rpc("dashboard_summary", {
    target_sheet_id: input.sheetId,
    target_year: input.year,
    target_month: input.month,
  });

  if (error) {
    throw error;
  }

  const row = (data?.[0] ?? null) as DashboardSummaryRow | null;

  return {
    incomeTotal: row?.income_total ?? "0",
    expenseTotal: row?.expense_total ?? "0",
    chartData: (row?.chart_data ?? []).map((point) => ({
      month: point.month,
      income: Number(point.income ?? 0),
      expense: Number(point.expense ?? 0),
    })),
    recentTransactions: row?.recent_transactions ?? [],
  } satisfies DashboardSummary;
}
