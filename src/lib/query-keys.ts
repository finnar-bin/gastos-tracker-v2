export const queryKeys = {
  sheet: (sheetId: string) => ["sheet", sheetId] as const,
  sheetSelector: () => ["sheet-selector"] as const,
  dashboard: (sheetId: string) => ["sheet", sheetId, "dashboard"] as const,
  history: (
    sheetId: string,
    filters: {
      year: number;
      month: number;
      type?: "income" | "expense" | null;
      categoryId?: string | null;
    },
  ) =>
    [
      "sheet",
      sheetId,
      "history",
      {
        year: filters.year,
        month: filters.month,
        type: filters.type ?? "all",
        categoryId: filters.categoryId ?? "all",
      },
    ] as const,
  transactionsOverview: (
    sheetId: string,
    filters: {
      year: number;
      month: number;
      type: "income" | "expense";
    },
  ) =>
    [
      "sheet",
      sheetId,
      "transactions-overview",
      {
        year: filters.year,
        month: filters.month,
        type: filters.type,
      },
    ] as const,
  categoryTransactions: (
    sheetId: string,
    categoryId: string,
    filters: {
      year: number;
      month: number;
      type: "income" | "expense";
    },
  ) =>
    [
      "sheet",
      sheetId,
      "category-transactions",
      categoryId,
      {
        year: filters.year,
        month: filters.month,
        type: filters.type,
      },
    ] as const,
  users: (sheetId: string) => ["sheet", sheetId, "users"] as const,
  memberDirectory: (sheetId: string) =>
    ["sheet", sheetId, "member-directory"] as const,
  recurring: (sheetId: string) => ["sheet", sheetId, "recurring"] as const,
  categories: (sheetId: string, type?: "income" | "expense") =>
    ["sheet", sheetId, "categories", type ?? "all"] as const,
  paymentTypes: (sheetId: string) =>
    ["sheet", sheetId, "payment-types"] as const,
  sheetCurrency: (sheetId: string) =>
    ["sheet", sheetId, "currency"] as const,
  categoryForm: (sheetId: string, categoryId: string) =>
    ["sheet", sheetId, "category-form", categoryId] as const,
  paymentTypeForm: (sheetId: string, paymentTypeId: string) =>
    ["sheet", sheetId, "payment-type-form", paymentTypeId] as const,
  transactionForm: (
    sheetId: string,
    mode: "add" | "edit",
    idOrNew: string,
    type: "income" | "expense" | "unknown",
  ) =>
    ["sheet", sheetId, "transaction-form", mode, idOrNew, type] as const,
  recurringForm: (sheetId: string, mode: "add" | "edit", idOrNew: string) =>
    ["sheet", sheetId, "recurring-form", mode, idOrNew] as const,
};
