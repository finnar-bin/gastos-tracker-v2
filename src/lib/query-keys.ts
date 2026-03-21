export const queryKeys = {
  sheetSelector: () => ["sheet-selector"] as const,
  categories: (sheetId: string, type?: "income" | "expense") =>
    ["sheet", sheetId, "categories", type ?? "all"] as const,
  paymentTypes: (sheetId: string) =>
    ["sheet", sheetId, "payment-types"] as const,
  sheetCurrency: (sheetId: string) =>
    ["sheet", sheetId, "currency"] as const,
};
