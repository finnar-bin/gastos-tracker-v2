import { requireSheetAccess } from "@/lib/auth/sheets";
import { LayoutList } from "lucide-react";
import { Header } from "@/components/Header";
import { TransactionsContent } from "./transactions-content";

export default async function YearOverviewPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const { sheet } = await requireSheetAccess(sheetId);

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6">
      <Header
        title="Transactions"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}`}
        icon={LayoutList}
        subtitle={sheet.name}
      />

      <TransactionsContent sheetId={sheetId} />
    </div>
  );
}
