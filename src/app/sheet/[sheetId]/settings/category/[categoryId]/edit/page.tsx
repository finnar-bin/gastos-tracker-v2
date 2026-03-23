import { requireSheetPermission } from "@/lib/auth/sheets";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { CategoryFormDialog } from "../../category-form-dialog";

export default async function EditCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ sheetId: string; categoryId: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { sheetId, categoryId } = await params;
  const resolvedSearchParams = await searchParams;
  const { sheet } = await requireSheetPermission(sheetId, "canEditCategory");
  const selectedType =
    resolvedSearchParams.type === "income" ? "income" : "expense";

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <Header
        title="Edit Category"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}/settings/category?type=${selectedType}`}
        icon={ArrowLeft}
        subtitle={sheet.name}
      />

      <CategoryFormDialog
        sheetId={sheetId}
        categoryId={categoryId}
        returnType={selectedType}
      />
    </div>
  );
}
