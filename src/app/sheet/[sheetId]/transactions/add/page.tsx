import { requireSheetAccess } from "@/lib/auth/sheets";
import { addTransaction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { db } from "@/lib/db";
import { categories, paymentTypes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getLucideIcon } from "@/lib/lucide-icons";
import { ArrowDownCircle, ArrowUpCircle, ReceiptText } from "lucide-react";
import { LoadingButton } from "@/components/loading-button";

export default async function AddTransactionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sheetId: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { sheetId } = await params;
  const { sheet } = await requireSheetAccess(sheetId);
  const selectedSheetId = sheet.id;

  const { type: queryType } = await searchParams;
  const normalizedType = queryType?.toLowerCase();
  const type =
    normalizedType === "income" || normalizedType === "expense"
      ? normalizedType
      : null;

  if (!type) {
    return (
      <div className="container max-w-md mx-auto p-4 flex items-center justify-center min-h-[80vh]">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ReceiptText className="h-4 w-4" />
              Select Transaction Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link
              href={`/sheet/${selectedSheetId}/transactions/add?type=expense`}
              className="block rounded-lg border p-4 transition-colors hover:bg-accent/70"
            >
              <div className="flex items-center gap-3">
                <ArrowDownCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium">Expense</p>
                  <p className="text-sm text-muted-foreground">
                    Record money going out
                  </p>
                </div>
              </div>
            </Link>
            <Link
              href={`/sheet/${selectedSheetId}/transactions/add?type=income`}
              className="block rounded-lg border p-4 transition-colors hover:bg-accent/70"
            >
              <div className="flex items-center gap-3">
                <ArrowUpCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Income</p>
                  <p className="text-sm text-muted-foreground">
                    Record money coming in
                  </p>
                </div>
              </div>
            </Link>
            <div className="pt-2 space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/sheet/${selectedSheetId}`}>Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpense = type === "expense";

  // 1. Get categories for the sheet
  const availableCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.sheetId, selectedSheetId));

  const availablePaymentTypes = await db
    .select()
    .from(paymentTypes)
    .where(eq(paymentTypes.sheetId, selectedSheetId));

  const filteredCategories = availableCategories.filter(
    (cat) => cat.type === type,
  );

  return (
    <div className="container max-w-md mx-auto p-4 flex items-center justify-center min-h-[80vh]">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ReceiptText className="h-4 w-4" />
            Add {isExpense ? "Expense" : "Income"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCategories.length === 0 ? (
            <div className="space-y-4 py-6 text-center">
              <p className="text-muted-foreground">
                No categories found for this sheet (type: {type}). Please add
                some categories first.
              </p>
              <Button asChild className="w-full">
                <Link href={`/sheet/${selectedSheetId}/settings/category`}>
                  Create Category
                </Link>
              </Button>
              <div className="pt-2 space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/sheet/${selectedSheetId}`}>Cancel</Link>
                </Button>
              </div>
            </div>
          ) : (
            <form action={addTransaction} className="space-y-4">
              <input type="hidden" name="type" value={type} />
              <input type="hidden" name="sheetId" value={selectedSheetId} />

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <Select name="categoryId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((cat) => {
                      const Icon = getLucideIcon(cat.icon);
                      return (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            {Icon && <Icon className="h-4 w-4" />}
                            <span>{cat.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {isExpense && (
                <div className="space-y-2">
                  <Label htmlFor="paymentType">Payment Type</Label>
                  <Select name="paymentType" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePaymentTypes.map((pt) => {
                        const Icon = getLucideIcon(pt.icon);
                        return (
                          <SelectItem key={pt.id} value={pt.id}>
                            <div className="flex items-center gap-2">
                              {Icon && <Icon className="w-4 h-4" />}
                              <span>{pt.name}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="date">Transaction Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Optional note"
                />
              </div>

              <div className="pt-4 space-y-2">
                <LoadingButton
                  type="submit"
                  className="w-full"
                  text="Save"
                  loadingText="Saving..."
                />
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/sheet/${selectedSheetId}`}>Cancel</Link>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
