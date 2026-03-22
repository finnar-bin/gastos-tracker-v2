import { createClient } from "@/lib/supabase/client";

type HistoryFeedRow = {
  transaction_id: string;
  amount: string;
  transaction_type: "income" | "expense";
  description: string | null;
  transaction_date: string;
  category_id: string;
  category_name: string;
  category_type: "income" | "expense";
  category_icon: string;
  payment_type_name: string | null;
  payment_type_icon: string | null;
  created_by: string;
  creator_display_name: string | null;
  creator_email: string | null;
  creator_avatar_url: string | null;
};

export type HistoryFeedItem = {
  id: string;
  amount: string;
  type: "income" | "expense";
  description: string | null;
  date: string;
  categoryId: string;
  categoryName: string;
  categoryType: "income" | "expense";
  categoryIcon: string;
  paymentTypeName: string | null;
  paymentTypeIcon: string | null;
  creatorDisplayName: string | null;
  creatorEmail: string | null;
  creatorAvatarUrl: string | null;
};

const supabase = createClient();

export async function fetchHistoryFeed(input: {
  sheetId: string;
  year: number;
  month: number;
  type: "income" | "expense" | null;
  categoryId: string | null;
}) {
  const { data, error } = await supabase.rpc("history_feed", {
    target_sheet_id: input.sheetId,
    target_year: input.year,
    target_month: input.month,
    target_type: input.type,
    target_category_id: input.categoryId,
  });

  if (error) {
    throw error;
  }

  return ((data ?? []) as HistoryFeedRow[]).map((row) => ({
    id: row.transaction_id,
    amount: row.amount,
    type: row.transaction_type,
    description: row.description,
    date: row.transaction_date,
    categoryId: row.category_id,
    categoryName: row.category_name,
    categoryType: row.category_type,
    categoryIcon: row.category_icon,
    paymentTypeName: row.payment_type_name,
    paymentTypeIcon: row.payment_type_icon,
    creatorDisplayName: row.creator_display_name,
    creatorEmail: row.creator_email,
    creatorAvatarUrl: row.creator_avatar_url,
  })) satisfies HistoryFeedItem[];
}
