import { requireSheetAccess } from "@/lib/auth/sheets";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import CategoryForm from "./form";

export default async function AddCategoryPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const { sheet } = await requireSheetAccess(sheetId);

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <div className="flex items-center gap-2">
        <Link href={`/sheet/${sheetId}/settings/category`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">New Category</h1>
          <p className="text-sm text-muted-foreground">{sheet.name}</p>
        </div>
      </div>

      <CategoryForm sheetId={sheetId} />
    </div>
  );
}
