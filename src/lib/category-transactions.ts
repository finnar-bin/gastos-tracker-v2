import { createClient } from "@/lib/supabase/client";

type CategoryTransactionsRow = {
  transaction_id: string;
  amount: string;
  transaction_type: "income" | "expense";
  description: string | null;
  transaction_date: string;
  payment_type_name: string | null;
  payment_type_icon: string | null;
  creator_display_name: string | null;
  creator_email: string | null;
  creator_avatar_url: string | null;
};

export type CategoryTransactionsItem = {
  id: string;
  amount: string;
  type: "income" | "expense";
  description: string | null;
  date: string;
  paymentTypeName: string | null;
  paymentTypeIcon: string | null;
  creatorDisplayName: string | null;
  creatorEmail: string | null;
  creatorAvatarUrl: string | null;
};

const supabase = createClient();

export async function fetchCategoryTransactions(input: {
  sheetId: string;
  categoryId: string;
  year: number;
  month: number;
}) {
  const { data, error } = await supabase.rpc("category_transactions", {
    target_sheet_id: input.sheetId,
    target_category_id: input.categoryId,
    target_year: input.year,
    target_month: input.month,
  });

  if (error) {
    throw error;
  }

  return ((data ?? []) as CategoryTransactionsRow[]).map((row) => ({
    id: row.transaction_id,
    amount: row.amount,
    type: row.transaction_type,
    description: row.description,
    date: row.transaction_date,
    paymentTypeName: row.payment_type_name,
    paymentTypeIcon: row.payment_type_icon,
    creatorDisplayName: row.creator_display_name,
    creatorEmail: row.creator_email,
    creatorAvatarUrl: row.creator_avatar_url,
  })) satisfies CategoryTransactionsItem[];
}
