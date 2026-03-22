import { createClient } from "@/lib/supabase/client";

type RecurringOverviewRow = {
  id: string;
  amount: string;
  type: "income" | "expense";
  description: string | null;
  frequency: string;
  next_process_date: string;
  is_active: boolean;
  created_at: string;
  category_id: string;
  category_name: string;
  category_icon: string;
  payment_type_id: string | null;
  payment_type_name: string | null;
};

export type RecurringOverviewItem = {
  id: string;
  amount: string;
  type: "income" | "expense";
  description: string | null;
  frequency: string;
  next_process_date: string;
  is_active: boolean;
  created_at: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  paymentTypeId: string | null;
  paymentTypeName: string | null;
};

const supabase = createClient();

export async function fetchRecurringOverview(sheetId: string) {
  const { data, error } = await supabase
    .from("recurring_overview")
    .select(
      "id, amount, type, description, frequency, next_process_date, is_active, created_at, category_id, category_name, category_icon, payment_type_id, payment_type_name",
    )
    .eq("sheet_id", sheetId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as RecurringOverviewRow[]).map((row) => ({
    id: row.id,
    amount: row.amount,
    type: row.type,
    description: row.description,
    frequency: row.frequency,
    next_process_date: row.next_process_date,
    is_active: row.is_active,
    created_at: row.created_at,
    categoryId: row.category_id,
    categoryName: row.category_name,
    categoryIcon: row.category_icon,
    paymentTypeId: row.payment_type_id,
    paymentTypeName: row.payment_type_name,
  })) satisfies RecurringOverviewItem[];
}
