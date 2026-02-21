import { requireSheetAccess } from "@/lib/auth/sheets";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CategorySettingsPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const { sheet } = await requireSheetAccess(sheetId);

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/sheet/${sheetId}/settings`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground">{sheet.name}</p>
        </div>
      </div>

      <div className="text-center text-muted-foreground p-8">
        Category management coming soon!
      </div>
    </div>
  );
}
