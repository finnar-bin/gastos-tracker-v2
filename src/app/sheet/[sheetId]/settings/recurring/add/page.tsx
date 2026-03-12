import { requireSheetPermission } from "@/lib/auth/sheets";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { RecurringFormLoader } from "../recurring-form-loader";

export default async function AddRecurringPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const { sheet } = await requireSheetPermission(
    sheetId,
    "canAddRecurringTransaction",
  );

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <Header
        title="New Recurring"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}/settings/recurring`}
        icon={ArrowLeft}
        subtitle={sheet.name}
      />

      <RecurringFormLoader sheetId={sheetId} />
    </div>
  );
}
