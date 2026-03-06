import { requireSheetAccess } from "@/lib/auth/sheets";
import { ArrowLeft } from "lucide-react";
import CategoryForm from "./form";
import { Header } from "@/components/Header";

export default async function AddCategoryPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  await requireSheetAccess(sheetId);

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <Header
        title="New Category"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}/settings/category`}
        icon={ArrowLeft}
      />

      <CategoryForm sheetId={sheetId} />
    </div>
  );
}
