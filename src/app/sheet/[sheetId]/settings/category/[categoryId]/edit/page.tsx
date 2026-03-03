import { requireSheetAccess } from "@/lib/auth/sheets";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import CategoryForm from "../../add/form";
import type { CategoryFormData } from "../../add/form";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ sheetId: string; categoryId: string }>;
}) {
  const { sheetId, categoryId } = await params;
  const { sheet } = await requireSheetAccess(sheetId);

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
  };

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <div className="flex items-center gap-2">
        <Link href={`/sheet/${sheetId}/settings/category`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Edit Category</h1>
          <p className="text-sm text-muted-foreground">{sheet.name}</p>
        </div>
      </div>

      <CategoryForm sheetId={sheetId} mode="edit" initialData={initialData} />
    </div>
  );
}
