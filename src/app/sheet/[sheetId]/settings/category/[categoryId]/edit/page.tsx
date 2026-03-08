import { requireSheetPermission } from "@/lib/auth/sheets";
import { ArrowLeft } from "lucide-react";
import CategoryForm from "../../add/form";
import type { CategoryFormData } from "../../add/form";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ sheetId: string; categoryId: string }>;
}) {
  const { sheetId, categoryId } = await params;
  await requireSheetPermission(sheetId, "canEditCategory");

  const [category] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.sheetId, sheetId)))
    .limit(1);

  if (!category) {
    notFound();
  }

  const initialData: CategoryFormData = {
    id: category.id,
    name: category.name,
    icon: category.icon,
    type: category.type,
    budget: category.budget,
    defaultAmount: category.defaultAmount,
    dueDate: category.dueDate,
    dueReminderFrequency: category.dueReminderFrequency,
  };

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <Header
        title="Edit Category"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}/settings/category`}
        icon={ArrowLeft}
      />

      <CategoryForm sheetId={sheetId} mode="edit" initialData={initialData} />
    </div>
  );
}
