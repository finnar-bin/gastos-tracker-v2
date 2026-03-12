import { requireSheetAccess } from "@/lib/auth/sheets";
import { History } from "lucide-react";
import { Header } from "@/components/Header";
import { getSheetCurrency } from "@/lib/sheet-settings";
import { HistoryContent } from "./history-content";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const [{ permissions, sheet }, sheetCurrency] = await Promise.all([
    requireSheetAccess(sheetId),
    getSheetCurrency(sheetId),
  ]);

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 min-h-screen relative">
      <Header
        title="History"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}`}
        icon={History}
        subtitle={sheet.name}
      />

      <HistoryContent
        sheetId={sheetId}
        currency={sheetCurrency}
        canEditTransaction={permissions.canEditTransaction}
      />
    </div>
  );
}
