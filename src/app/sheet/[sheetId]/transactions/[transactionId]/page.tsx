import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { LayoutGrid } from "lucide-react";
import { requireSheetAccess } from "@/lib/auth/sheets";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { Header } from "@/components/Header";
import { getLucideIcon } from "@/lib/lucide-icons";
import { getSheetCurrency } from "@/lib/sheet-settings";
import { CategoryTransactionsContent } from "./category-transactions-content";

export default async function CategoryTransactionsPage({
  params,
}: {
  params: Promise<{ sheetId: string; transactionId: string }>;
}) {
  const { sheetId, transactionId } = await params;
  const [{ permissions, sheet }, sheetCurrency] = await Promise.all([
    requireSheetAccess(sheetId),
    getSheetCurrency(sheetId),
  ]);

  const categoryPromise = db
    .select({
      id: categories.id,
      name: categories.name,
      type: categories.type,
      icon: categories.icon,
    })
    .from(categories)
    .where(
      and(eq(categories.id, transactionId), eq(categories.sheetId, sheetId)),
    );
  const [category] = await categoryPromise;

  if (!category) {
    notFound();
  }
  const CategoryIcon = getLucideIcon(category.icon) || LayoutGrid;

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6">
      <Header
        title={category.name}
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}/transactions`}
        icon={CategoryIcon}
        subtitle={sheet.name}
      />

      <CategoryTransactionsContent
        sheetId={sheetId}
        categoryId={transactionId}
        categoryName={category.name}
        categoryIcon={category.icon}
        categoryType={category.type}
        currency={sheetCurrency}
        canEditTransaction={permissions.canEditTransaction}
      />
    </div>
  );
}
