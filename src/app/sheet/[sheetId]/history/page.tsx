import { requireSheetAccess } from "@/lib/auth/sheets";
import { History } from "lucide-react";
import { Header } from "@/components/Header";
import { SheetContentShell } from "@/components/sheet-content-shell";
import { HistoryContent } from "./history-content";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const { permissions, sheet } = await requireSheetAccess(sheetId);

  return (
    <SheetContentShell className="min-h-screen relative">
      <Header
        title="History"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}`}
        icon={History}
        subtitle={sheet.name}
      />

      <HistoryContent sheetId={sheetId} canEditTransaction={permissions.canEditTransaction} />
    </SheetContentShell>
  );
}
