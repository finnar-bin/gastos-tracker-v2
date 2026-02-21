import { requireSheetAccess } from "@/lib/auth/sheets";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { categories, paymentTypes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import RecurringTransactionForm from "./form";

export default async function AddRecurringPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const { sheet } = await requireSheetAccess(sheetId);

  const availableCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.sheetId, sheetId));

  const availablePaymentTypes = await db
    .select()
    .from(paymentTypes)
    .where(eq(paymentTypes.sheetId, sheetId));

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <div className="flex items-center gap-2">
        <Link href={`/sheet/${sheetId}/settings/recurring`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">New Recurring</h1>
          <p className="text-sm text-muted-foreground">{sheet.name}</p>
        </div>
      </div>

      <RecurringTransactionForm
        sheetId={sheetId}
        categories={availableCategories}
        paymentTypes={availablePaymentTypes}
      />
    </div>
  );
}
