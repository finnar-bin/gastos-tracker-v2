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

type TransactionRow = {
  id: string;
  amount: string;
  type: "income" | "expense";
  description: string | null;
  date: string;
  category_id: string;
  payment_type_id: string | null;
};

export type TransactionFormDataPayload = {
  categories: CategoryRow[];
  paymentTypes: PaymentTypeRow[];
  transaction: TransactionRow | null;
};

export async function fetchTransactionFormData(input: {
  supabase: ReturnType<typeof createClient>;
  sheetId: string;
  mode: "add" | "edit";
  transactionId?: string;
}): Promise<TransactionFormDataPayload> {
  const { supabase, sheetId, mode, transactionId } = input;
  const [categoriesResult, paymentTypesResult, transactionResult] =
    await Promise.all([
      supabase
        .from("categories")
        .select("id, name, icon, type, default_amount")
        .eq("sheet_id", sheetId)
        .order("name", { ascending: true }),
      supabase
        .from("payment_types")
        .select("id, name, icon")
        .eq("sheet_id", sheetId)
        .order("name", { ascending: true }),
      mode === "edit" && transactionId
        ? supabase
            .from("transactions")
            .select(
              "id, amount, type, description, date, category_id, payment_type_id",
            )
            .eq("sheet_id", sheetId)
            .eq("id", transactionId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

  if (categoriesResult.error) throw categoriesResult.error;
  if (paymentTypesResult.error) throw paymentTypesResult.error;
  if (transactionResult.error) throw transactionResult.error;

  return {
    categories: (categoriesResult.data ?? []) as CategoryRow[],
    paymentTypes: (paymentTypesResult.data ?? []) as PaymentTypeRow[],
    transaction: transactionResult.data as TransactionRow | null,
  };
}
import type { createClient } from "@/lib/supabase/client";
