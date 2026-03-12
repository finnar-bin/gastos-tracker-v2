import { requireSheetPermission } from "@/lib/auth/sheets";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { CategoryFormLoader } from "../../category-form-loader";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ sheetId: string; categoryId: string }>;
}) {
  const { sheetId, categoryId } = await params;
  const { sheet } = await requireSheetPermission(sheetId, "canEditCategory");

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <Header
        title="Edit Category"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}/settings/category`}
        icon={ArrowLeft}
        subtitle={sheet.name}
      />

      <CategoryFormLoader sheetId={sheetId} categoryId={categoryId} />
    </div>
  );
}
