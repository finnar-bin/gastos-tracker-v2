import { requireSheetAccess } from "@/lib/auth/sheets";
import { db } from "@/lib/db";
import {
  recurringTransactions,
  categories,
  paymentTypes,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  ArrowLeft,
  Plus,
  Repeat,
  Calendar,
  CreditCard,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function RecurringTransactionsPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const { sheet } = await requireSheetAccess(sheetId);

  const recurringList = await db
    .select({
      id: recurringTransactions.id,
      amount: recurringTransactions.amount,
      type: recurringTransactions.type,
      description: recurringTransactions.description,
      frequency: recurringTransactions.frequency,
      dayOfMonth: recurringTransactions.dayOfMonth,
      nextProcessDate: recurringTransactions.nextProcessDate,
      isActive: recurringTransactions.isActive,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      paymentTypeName: paymentTypes.name,
    })
    .from(recurringTransactions)
    .where(eq(recurringTransactions.sheetId, sheetId))
    .leftJoin(categories, eq(recurringTransactions.categoryId, categories.id))
    .leftJoin(
      paymentTypes,
      eq(recurringTransactions.paymentType, paymentTypes.id),
    )
    .orderBy(desc(recurringTransactions.createdAt));

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={`/sheet/${sheetId}/settings`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Recurring</h1>
            <p className="text-sm text-muted-foreground">{sheet.name}</p>
          </div>
        </div>
        <Link href={`/sheet/${sheetId}/settings/recurring/add`}>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {recurringList.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
            <Repeat className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground">
              No recurring transactions yet.
            </p>
            <Link
              href={`/sheet/${sheetId}/settings/recurring/add`}
              className="mt-4 inline-block"
            >
              <Button variant="outline" size="sm">
                Create your first one
              </Button>
            </Link>
          </div>
        ) : (
          recurringList.map((rt) => (
            <Card
              key={rt.id}
              className="overflow-hidden border-none shadow-sm bg-card hover:bg-accent/5 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                      {rt.categoryIcon || "💰"}
                    </div>
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {rt.description || rt.categoryName}
                        {!rt.isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 border rounded-md font-medium text-muted-foreground">
                            Paused
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Next:{" "}
                        {new Date(rt.nextProcessDate).toLocaleDateString()} (
                        {rt.frequency})
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-bold ${rt.type === "income" ? "text-green-600" : "text-primary"}`}
                    >
                      {rt.type === "income" ? "+" : "-"}${rt.amount}
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                      <CreditCard className="h-3 w-3" />
                      {rt.paymentTypeName || "Default"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
