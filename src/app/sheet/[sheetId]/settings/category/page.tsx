import { requireSheetAccess } from "@/lib/auth/sheets";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { CategoryList } from "./category-list";

export default async function CategorySettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ sheetId: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { sheetId } = await params;
  const resolvedSearchParams = await searchParams;
  const { permissions, sheet } = await requireSheetAccess(sheetId);
  const selectedType =
    resolvedSearchParams.type === "income" ? "income" : "expense";

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <Header
        title="Categories"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}/settings`}
        icon={ArrowLeft}
        subtitle={sheet.name}
        actions={
          permissions.canAddCategory ? (
            <Link
              href={`/sheet/${sheetId}/settings/category/add?type=${selectedType}`}
            >
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </Link>
          ) : null
        }
      />

      <CategoryList
        sheetId={sheetId}
        canAddCategory={permissions.canAddCategory}
        canEditCategory={permissions.canEditCategory}
      />
    </div>
  );
}
