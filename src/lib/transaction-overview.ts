import { createClient } from "@/lib/supabase/client";

type TransactionOverviewRow = {
  category_id: string;
  category_name: string;
  category_icon: string;
  category_type: "income" | "expense";
  budget: string | null;
  total_amount: string;
};

export type TransactionOverviewItem = {
  id: string;
  name: string;
  icon: string;
  type: "income" | "expense";
  budget: string | null;
  totalAmount: string;
};

const supabase = createClient();

export async function fetchTransactionOverview(input: {
  sheetId: string;
  year: number;
  month: number;
  type: "income" | "expense";
}) {
  const { data, error } = await supabase.rpc("transaction_overview", {
    target_sheet_id: input.sheetId,
    target_year: input.year,
    target_month: input.month,
    target_type: input.type,
  });

  if (error) {
    throw error;
  }

  return ((data ?? []) as TransactionOverviewRow[]).map((row) => ({
    id: row.category_id,
    name: row.category_name,
    icon: row.category_icon,
    type: row.category_type,
    budget: row.budget,
    totalAmount: row.total_amount,
  })) satisfies TransactionOverviewItem[];
}
