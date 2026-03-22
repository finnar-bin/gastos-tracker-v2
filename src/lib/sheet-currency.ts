import { createClient } from "@/lib/supabase/client";

type SheetCurrencyRow = {
  currency: string;
};

const supabase = createClient();

export async function fetchSheetCurrency(sheetId: string) {
  const { data, error } = await supabase
    .from("sheet_settings")
    .select("currency")
    .eq("sheet_id", sheetId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return ((data as SheetCurrencyRow | null)?.currency ?? "USD") as string;
}
