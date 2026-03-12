import { requireSheetAccess } from "@/lib/auth/sheets";
import { LayoutList } from "lucide-react";
import { Header } from "@/components/Header";
import { getSheetCurrency } from "@/lib/sheet-settings";
import { TransactionsContent } from "./transactions-content";

export default async function YearOverviewPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const [{ sheet }, sheetCurrency] = await Promise.all([
    requireSheetAccess(sheetId),
    getSheetCurrency(sheetId),
  ]);

  return (
    <div className="container max-w-md mx-auto p-4 h-dvh flex flex-col gap-6 overflow-hidden">
      <Header
        title="Transactions"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}`}
        icon={LayoutList}
        subtitle={sheet.name}
      />

      <TransactionsContent sheetId={sheetId} currency={sheetCurrency} />
    </div>
  );
}
