import { requireSheetAccess } from "@/lib/auth/sheets";
import { LayoutList } from "lucide-react";
import { Header } from "@/components/Header";

export default async function YearOverviewPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  await requireSheetAccess(sheetId);

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6">
      <Header
        title="Transactions"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}`}
        icon={LayoutList}
      />
      <div className="text-center text-muted-foreground p-8">Coming soon!</div>
    </div>
  );
}
