import { requireSheetPermission } from "@/lib/auth/sheets";
import { Header } from "@/components/Header";
import { ArrowLeft } from "lucide-react";
import { TransactionFormLoader } from "../../transaction-form-loader";

function getSafeReturnHref({
  sheetId,
  returnTo,
}: {
  sheetId: string;
  returnTo?: string;
}) {
  const fallback = `/sheet/${sheetId}/history`;
  if (!returnTo) return fallback;
  if (returnTo.startsWith(`/sheet/${sheetId}`)) return returnTo;
  return fallback;
}

export default async function EditTransactionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sheetId: string; transactionId: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { sheetId, transactionId } = await params;
  const { returnTo } = await searchParams;
  const { sheet } = await requireSheetPermission(sheetId, "canEditTransaction");
  const backHref = getSafeReturnHref({ sheetId, returnTo });

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <Header
        title="Edit Transaction"
        sheetId={sheetId}
        backHref={backHref}
        icon={ArrowLeft}
        subtitle={sheet.name}
      />

      <TransactionFormLoader
        sheetId={sheetId}
        mode="edit"
        transactionId={transactionId}
        cancelHref={backHref}
      />
    </div>
  );
}
